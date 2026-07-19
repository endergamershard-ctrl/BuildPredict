use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "pricing.json";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PricingSettings {
  pub best_buy_key: String,
  pub retailer_api_key: String,
  pub enabled_providers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartSkuInput {
  pub id: String,
  pub name: String,
  pub manufacturer: String,
  pub skus: PartSkus,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PartSkus {
  pub amazon: Option<String>,
  pub newegg: Option<String>,
  pub bestbuy: Option<String>,
  pub walmart: Option<String>,
  pub upc: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PriceQuote {
  pub part_id: String,
  pub provider: String,
  pub retailer: String,
  pub price: f64,
  pub currency: String,
  pub in_stock: Option<bool>,
  pub url: Option<String>,
  pub match_confidence: String,
  pub fetched_at: String,
}

fn load_settings(app: &AppHandle) -> PricingSettings {
  let Ok(store) = app.store(STORE_PATH) else {
    return PricingSettings::default();
  };
  store
    .get("settings")
    .and_then(|v| serde_json::from_value(v).ok())
    .unwrap_or_default()
}

fn save_settings(app: &AppHandle, settings: &PricingSettings) -> Result<(), String> {
  let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
  store.set(
    "settings".to_string(),
    serde_json::to_value(settings).map_err(|e| e.to_string())?,
  );
  store.save().map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
pub fn get_pricing_settings(app: AppHandle) -> PricingSettings {
  load_settings(&app)
}

#[tauri::command]
pub fn save_pricing_settings(app: AppHandle, settings: PricingSettings) -> Result<(), String> {
  save_settings(&app, &settings)
}

async fn bestbuy_quote(part: &PartSkuInput, api_key: &str) -> Option<PriceQuote> {
  let client = reqwest::Client::new();
  let sku = part.skus.bestbuy.as_deref()?;
  let url = format!(
    "https://api.bestbuy.com/v1/products/{}.json?apiKey={}&show=sku,name,salePrice,regularPrice,url,onlineAvailability",
    urlencoding::encode(sku),
    urlencoding::encode(api_key)
  );
  let resp = client.get(&url).send().await.ok()?;
  if !resp.status().is_success() {
    return None;
  }
  let json: serde_json::Value = resp.json().await.ok()?;
  let price = json
    .get("salePrice")
    .or_else(|| json.get("regularPrice"))
    .and_then(|v| v.as_f64())?;
  Some(PriceQuote {
    part_id: part.id.clone(),
    provider: "bestbuy".into(),
    retailer: "Best Buy".into(),
    price,
    currency: "USD".into(),
    in_stock: json.get("onlineAvailability").and_then(|v| v.as_bool()),
    url: json.get("url").and_then(|v| v.as_str()).map(str::to_string),
    match_confidence: "sku".into(),
    fetched_at: Utc::now().to_rfc3339(),
  })
}

async fn retailerapi_quote(part: &PartSkuInput, api_key: &str) -> Option<PriceQuote> {
  let client = reqwest::Client::new();
  let identifier = part
    .skus
    .upc
    .as_deref()
    .or(part.skus.amazon.as_deref())
    .or(part.skus.bestbuy.as_deref())?;
  let url = format!(
    "https://api.retailerapi.com/v1/lookup_product?identifier={}&include_cross_retailer=true",
    urlencoding::encode(identifier)
  );
  let resp = client
    .get(&url)
    .header("Authorization", format!("RETAILERAPI_KEY {}", api_key))
    .header("User-Agent", "BuildPredict/0.2")
    .send()
    .await
    .ok()?;
  if !resp.status().is_success() {
    return None;
  }
  let json: serde_json::Value = resp.json().await.ok()?;
  let price = json
    .pointer("/price")
    .or_else(|| json.pointer("/current_price"))
    .or_else(|| json.pointer("/data/price"))
    .and_then(|v| v.as_f64())
    .or_else(|| {
      json
        .pointer("/cross_retailer")
        .and_then(|m| m.as_object())
        .and_then(|map| {
          map.values().find_map(|cell| {
            cell
              .get("price")
              .and_then(|p| p.as_f64())
              .filter(|p| *p > 0.0)
          })
        })
    })?;

  Some(PriceQuote {
    part_id: part.id.clone(),
    provider: "retailerapi".into(),
    retailer: "RetailerAPI".into(),
    price,
    currency: "USD".into(),
    in_stock: json
      .pointer("/in_stock")
      .and_then(|v| v.as_bool())
      .or(Some(true)),
    url: json
      .pointer("/url")
      .and_then(|v| v.as_str())
      .map(str::to_string),
    match_confidence: if part.skus.upc.is_some() {
      "exact".into()
    } else {
      "sku".into()
    },
    fetched_at: Utc::now().to_rfc3339(),
  })
}

#[tauri::command]
pub async fn fetch_price_quotes(
  app: AppHandle,
  parts: Vec<PartSkuInput>,
) -> Result<Vec<PriceQuote>, String> {
  let settings = load_settings(&app);
  let mut out = Vec::new();

  for part in parts {
    if settings.enabled_providers.iter().any(|p| p == "bestbuy")
      && !settings.best_buy_key.is_empty()
    {
      if let Some(q) = bestbuy_quote(&part, &settings.best_buy_key).await {
        out.push(q);
        continue;
      }
    }
    if settings
      .enabled_providers
      .iter()
      .any(|p| p == "retailerapi")
      && !settings.retailer_api_key.is_empty()
    {
      if let Some(q) = retailerapi_quote(&part, &settings.retailer_api_key).await {
        out.push(q);
      }
    }
  }

  Ok(out)
}
