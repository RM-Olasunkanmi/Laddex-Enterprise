import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "laddex"."enum_products_laddex_category" AS ENUM('palm-oil', 'tapioca', 'garri');
  CREATE TYPE "laddex"."enum_products_laddex_base_unit" AS ENUM('l', 'kg');
  CREATE TYPE "laddex"."enum_products_status" AS ENUM('draft', 'published');
  CREATE TYPE "laddex"."enum__products_v_version_laddex_category" AS ENUM('palm-oil', 'tapioca', 'garri');
  CREATE TYPE "laddex"."enum__products_v_version_laddex_base_unit" AS ENUM('l', 'kg');
  CREATE TYPE "laddex"."enum__products_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "laddex"."enum_orders_status" AS ENUM('new', 'ready', 'done', 'canceled', 'refunded');
  CREATE TYPE "laddex"."enum_orders_laddex_fulfilment" AS ENUM('delivery', 'pickup');
  CREATE TYPE "laddex"."enum_orders_laddex_channel" AS ENUM('online', 'phone', 'sales-desk');
  CREATE TYPE "laddex"."enum_orders_laddex_fee_basis" AS ENUM('region-rule', 'manual-quote', 'none');
  CREATE TYPE "laddex"."enum_carts_currency" AS ENUM('USD');
  CREATE TYPE "laddex"."enum_pages_hero_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "laddex"."enum_pages_hero_links_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "laddex"."enum_pages_blocks_cta_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "laddex"."enum_pages_blocks_cta_links_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "laddex"."enum_pages_blocks_archive_intro_alignment" AS ENUM('start', 'center');
  CREATE TYPE "laddex"."enum_pages_blocks_archive_content_type" AS ENUM('products', 'pages', 'categories');
  CREATE TYPE "laddex"."enum_pages_blocks_archive_display_mode" AS ENUM('grid', 'autoScroll');
  CREATE TYPE "laddex"."enum_pages_blocks_archive_populate_by" AS ENUM('collection', 'selection');
  CREATE TYPE "laddex"."enum_pages_blocks_content_columns_size" AS ENUM('oneThird', 'half', 'twoThirds', 'full');
  CREATE TYPE "laddex"."enum_pages_blocks_content_columns_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "laddex"."enum_pages_hero_type" AS ENUM('none', 'highImpact', 'mediumImpact', 'lowImpact');
  CREATE TYPE "laddex"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "laddex"."enum__pages_v_version_hero_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "laddex"."enum__pages_v_version_hero_links_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "laddex"."enum__pages_v_blocks_cta_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "laddex"."enum__pages_v_blocks_cta_links_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "laddex"."enum__pages_v_blocks_archive_intro_alignment" AS ENUM('start', 'center');
  CREATE TYPE "laddex"."enum__pages_v_blocks_archive_content_type" AS ENUM('products', 'pages', 'categories');
  CREATE TYPE "laddex"."enum__pages_v_blocks_archive_display_mode" AS ENUM('grid', 'autoScroll');
  CREATE TYPE "laddex"."enum__pages_v_blocks_archive_populate_by" AS ENUM('collection', 'selection');
  CREATE TYPE "laddex"."enum__pages_v_blocks_content_columns_size" AS ENUM('oneThird', 'half', 'twoThirds', 'full');
  CREATE TYPE "laddex"."enum__pages_v_blocks_content_columns_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "laddex"."enum__pages_v_version_hero_type" AS ENUM('none', 'highImpact', 'mediumImpact', 'lowImpact');
  CREATE TYPE "laddex"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "laddex"."enum_category_status" AS ENUM('draft', 'published');
  CREATE TYPE "laddex"."enum__category_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "laddex"."enum_variants_laddex_size_unit" AS ENUM('ml', 'l', 'g', 'kg');
  CREATE TYPE "laddex"."enum_variants_laddex_packaging" AS ENUM('bottle', 'pouch', 'bag', 'sack');
  CREATE TYPE "laddex"."enum_variants_laddex_format" AS ENUM('packaged', 'bulk');
  CREATE TYPE "laddex"."enum_variants_status" AS ENUM('draft', 'published');
  CREATE TYPE "laddex"."enum__variants_v_version_laddex_size_unit" AS ENUM('ml', 'l', 'g', 'kg');
  CREATE TYPE "laddex"."enum__variants_v_version_laddex_packaging" AS ENUM('bottle', 'pouch', 'bag', 'sack');
  CREATE TYPE "laddex"."enum__variants_v_version_laddex_format" AS ENUM('packaged', 'bulk');
  CREATE TYPE "laddex"."enum__variants_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "laddex"."enum_variant_types_selector_style" AS ENUM('swatch', 'buttons', 'select');
  CREATE TYPE "laddex"."enum_users_roles" AS ENUM('admin', 'analyst', 'customer');
  CREATE TYPE "laddex"."enum_users_wholesale_status" AS ENUM('none', 'pending', 'approved');
  CREATE TYPE "laddex"."enum_transactions_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'expired', 'refunded');
  CREATE TYPE "laddex"."enum_transactions_currency" AS ENUM('USD');
  CREATE TYPE "laddex"."enum_checkout_sessions_fulfilment" AS ENUM('delivery', 'pickup');
  CREATE TYPE "laddex"."enum_checkout_sessions_fee_basis" AS ENUM('region-rule', 'manual-quote', 'none');
  CREATE TYPE "laddex"."enum_checkout_sessions_currency" AS ENUM('NGN');
  CREATE TYPE "laddex"."enum_checkout_sessions_status" AS ENUM('created', 'initialized', 'paid', 'order-created', 'failed', 'expired');
  CREATE TYPE "laddex"."enum_delivery_zones_region_id" AS ENUM('south-west', 'south-east', 'south-south', 'north-central', 'north-west', 'north-east');
  CREATE TYPE "laddex"."enum_wholesale_applications_business_type" AS ENUM('retailer', 'caterer', 'restaurant', 'distributor', 'processor', 'other');
  CREATE TYPE "laddex"."enum_wholesale_applications_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "laddex"."enum_quote_requests_status" AS ENUM('new', 'priced', 'responded', 'closed');
  CREATE TYPE "laddex"."enum_addresses_country" AS ENUM('US', 'GB', 'CA', 'AU', 'AT', 'BE', 'BR', 'BG', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HK', 'HU', 'IN', 'IE', 'IT', 'JP', 'LV', 'LT', 'LU', 'MY', 'MT', 'MX', 'NL', 'NZ', 'NO', 'PL', 'PT', 'RO', 'SG', 'SK', 'SI', 'ES', 'SE', 'CH');
  CREATE TYPE "laddex"."enum_site_settings_header_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "laddex"."enum_site_settings_blocks_footer_nav_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "laddex"."enum_site_settings_blocks_content_columns_size" AS ENUM('oneThird', 'half', 'twoThirds', 'full');
  CREATE TYPE "laddex"."enum_site_settings_blocks_content_columns_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "laddex"."enum_site_settings_blocks_footer_icons_items_icon" AS ENUM('instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'x', 'whatsapp', 'website', 'phone', 'email');
  CREATE TYPE "laddex"."enum_site_settings_blocks_footer_icons_items_link_type" AS ENUM('reference', 'custom');
  CREATE TABLE "laddex"."products_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "laddex"."products_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "laddex"."products_laddex_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "laddex"."products_laddex_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "laddex"."products_laddex_packaging_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "laddex"."products_laddex_usage" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "laddex"."products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"title" varchar,
  	"inventory" numeric DEFAULT 0,
  	"price_in_u_s_d_enabled" boolean DEFAULT true,
  	"price_in_u_s_d" numeric,
  	"original_price_in_u_s_d" numeric,
  	"description" jsonb,
  	"laddex_category" "laddex"."enum_products_laddex_category",
  	"laddex_base_unit" "laddex"."enum_products_laddex_base_unit",
  	"laddex_summary" varchar,
  	"enable_variants" boolean,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone,
  	"_status" "laddex"."enum_products_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "laddex"."products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"category_id" integer,
  	"products_id" integer,
  	"variant_types_id" integer
  );
  
  CREATE TABLE "laddex"."_products_v_version_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_products_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_products_v_version_laddex_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_products_v_version_laddex_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_products_v_version_laddex_packaging_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_products_v_version_laddex_usage" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_products_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_inventory" numeric DEFAULT 0,
  	"version_price_in_u_s_d_enabled" boolean DEFAULT true,
  	"version_price_in_u_s_d" numeric,
  	"version_original_price_in_u_s_d" numeric,
  	"version_description" jsonb,
  	"version_laddex_category" "laddex"."enum__products_v_version_laddex_category",
  	"version_laddex_base_unit" "laddex"."enum__products_v_version_laddex_base_unit",
  	"version_laddex_summary" varchar,
  	"version_enable_variants" boolean,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_deleted_at" timestamp(3) with time zone,
  	"version__status" "laddex"."enum__products_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "laddex"."_products_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"category_id" integer,
  	"products_id" integer,
  	"variant_types_id" integer
  );
  
  CREATE TABLE "laddex"."orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"variant_id" integer,
  	"title" varchar NOT NULL,
  	"quantity" numeric NOT NULL,
  	"unit_price" numeric NOT NULL,
  	"line_total" numeric NOT NULL
  );
  
  CREATE TABLE "laddex"."orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer,
  	"status" "laddex"."enum_orders_status" DEFAULT 'new',
  	"amount" numeric,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"cart_id" integer,
  	"checkout_session_id" integer,
  	"payment_intent_id" varchar,
  	"laddex_lng" numeric,
  	"laddex_lat" numeric,
  	"laddex_street" varchar,
  	"laddex_landmark" varchar,
  	"laddex_notes" varchar,
  	"laddex_location_label" varchar,
  	"laddex_state" varchar,
  	"laddex_lga" varchar,
  	"laddex_fulfilment" "laddex"."enum_orders_laddex_fulfilment" DEFAULT 'delivery',
  	"laddex_channel" "laddex"."enum_orders_laddex_channel" DEFAULT 'online',
  	"laddex_fee_basis" "laddex"."enum_orders_laddex_fee_basis" DEFAULT 'none',
  	"laddex_fee_kobo" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."carts_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"variant_id" integer,
  	"quantity" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "laddex"."carts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"secret" varchar,
  	"customer_id" integer,
  	"purchased_at" timestamp(3) with time zone,
  	"subtotal" numeric,
  	"currency" "laddex"."enum_carts_currency" DEFAULT 'USD',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."pages_hero_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "laddex"."enum_pages_hero_links_link_type" DEFAULT 'reference',
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_new_tab" boolean,
  	"link_appearance" "laddex"."enum_pages_hero_links_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE "laddex"."pages_blocks_cta_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "laddex"."enum_pages_blocks_cta_links_link_type" DEFAULT 'reference',
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_new_tab" boolean,
  	"link_appearance" "laddex"."enum_pages_blocks_cta_links_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE "laddex"."pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rich_text" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."pages_blocks_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"intro_content" jsonb,
  	"intro_alignment" "laddex"."enum_pages_blocks_archive_intro_alignment" DEFAULT 'center',
  	"content_type" "laddex"."enum_pages_blocks_archive_content_type" DEFAULT 'products',
  	"display_mode" "laddex"."enum_pages_blocks_archive_display_mode" DEFAULT 'grid',
  	"populate_by" "laddex"."enum_pages_blocks_archive_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 10,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."pages_blocks_faq_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "laddex"."pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."pages_blocks_content_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" "laddex"."enum_pages_blocks_content_columns_size" DEFAULT 'full',
  	"rich_text" jsonb,
  	"enable_link" boolean,
  	"link_type" "laddex"."enum_pages_blocks_content_columns_link_type" DEFAULT 'reference',
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "laddex"."pages_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."pages_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "laddex"."pages_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."pages_blocks_html_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content_html" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"hero_type" "laddex"."enum_pages_hero_type" DEFAULT 'lowImpact',
  	"hero_rich_text" jsonb,
  	"hero_media_id" integer,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "laddex"."enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "laddex"."pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"products_id" integer,
  	"category_id" integer
  );
  
  CREATE TABLE "laddex"."_pages_v_version_hero_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "laddex"."enum__pages_v_version_hero_links_link_type" DEFAULT 'reference',
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_new_tab" boolean,
  	"link_appearance" "laddex"."enum__pages_v_version_hero_links_link_appearance" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_pages_v_blocks_cta_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "laddex"."enum__pages_v_blocks_cta_links_link_type" DEFAULT 'reference',
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_new_tab" boolean,
  	"link_appearance" "laddex"."enum__pages_v_blocks_cta_links_link_appearance" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"rich_text" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."_pages_v_blocks_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro_content" jsonb,
  	"intro_alignment" "laddex"."enum__pages_v_blocks_archive_intro_alignment" DEFAULT 'center',
  	"content_type" "laddex"."enum__pages_v_blocks_archive_content_type" DEFAULT 'products',
  	"display_mode" "laddex"."enum__pages_v_blocks_archive_display_mode" DEFAULT 'grid',
  	"populate_by" "laddex"."enum__pages_v_blocks_archive_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 10,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."_pages_v_blocks_faq_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_pages_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."_pages_v_blocks_content_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"size" "laddex"."enum__pages_v_blocks_content_columns_size" DEFAULT 'full',
  	"rich_text" jsonb,
  	"enable_link" boolean,
  	"link_type" "laddex"."enum__pages_v_blocks_content_columns_link_type" DEFAULT 'reference',
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_new_tab" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_pages_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."_pages_v_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_pages_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."_pages_v_blocks_html_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"content_html" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_hero_type" "laddex"."enum__pages_v_version_hero_type" DEFAULT 'lowImpact',
  	"version_hero_rich_text" jsonb,
  	"version_hero_media_id" integer,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "laddex"."enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "laddex"."_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"products_id" integer,
  	"category_id" integer
  );
  
  CREATE TABLE "laddex"."category_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "laddex"."category" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" jsonb,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "laddex"."enum_category_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "laddex"."_category_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_category_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_description" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "laddex"."enum__category_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "laddex"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "laddex"."seo_media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "laddex"."gallery_media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_gallery_url" varchar,
  	"sizes_gallery_width" numeric,
  	"sizes_gallery_height" numeric,
  	"sizes_gallery_mime_type" varchar,
  	"sizes_gallery_filesize" numeric,
  	"sizes_gallery_filename" varchar
  );
  
  CREATE TABLE "laddex"."reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"author_name" varchar NOT NULL,
  	"author_email" varchar,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"rating" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."variants_laddex_wholesale_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"min_qty" numeric,
  	"unit_price_kobo" numeric
  );
  
  CREATE TABLE "laddex"."variants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"product_id" integer,
  	"inventory" numeric DEFAULT 0,
  	"price_in_u_s_d_enabled" boolean DEFAULT false,
  	"price_in_u_s_d" numeric,
  	"original_price_in_u_s_d" numeric,
  	"laddex_sku" varchar,
  	"laddex_size_amount" numeric,
  	"laddex_size_unit" "laddex"."enum_variants_laddex_size_unit",
  	"laddex_content_base" numeric,
  	"laddex_packaging" "laddex"."enum_variants_laddex_packaging",
  	"laddex_format" "laddex"."enum_variants_laddex_format" DEFAULT 'packaged',
  	"laddex_retail_price_kobo" numeric,
  	"laddex_wholesale_min_qty" numeric DEFAULT 10,
  	"laddex_low_stock_threshold" numeric DEFAULT 5,
  	"laddex_shipping_weight_kg" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone,
  	"_status" "laddex"."enum_variants_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "laddex"."variants_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"variant_options_id" integer
  );
  
  CREATE TABLE "laddex"."_variants_v_version_laddex_wholesale_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"min_qty" numeric,
  	"unit_price_kobo" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "laddex"."_variants_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_product_id" integer,
  	"version_inventory" numeric DEFAULT 0,
  	"version_price_in_u_s_d_enabled" boolean DEFAULT false,
  	"version_price_in_u_s_d" numeric,
  	"version_original_price_in_u_s_d" numeric,
  	"version_laddex_sku" varchar,
  	"version_laddex_size_amount" numeric,
  	"version_laddex_size_unit" "laddex"."enum__variants_v_version_laddex_size_unit",
  	"version_laddex_content_base" numeric,
  	"version_laddex_packaging" "laddex"."enum__variants_v_version_laddex_packaging",
  	"version_laddex_format" "laddex"."enum__variants_v_version_laddex_format" DEFAULT 'packaged',
  	"version_laddex_retail_price_kobo" numeric,
  	"version_laddex_wholesale_min_qty" numeric DEFAULT 10,
  	"version_laddex_low_stock_threshold" numeric DEFAULT 5,
  	"version_laddex_shipping_weight_kg" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_deleted_at" timestamp(3) with time zone,
  	"version__status" "laddex"."enum__variants_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "laddex"."_variants_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"variant_options_id" integer
  );
  
  CREATE TABLE "laddex"."variant_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"selector_style" "laddex"."enum_variant_types_selector_style" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "laddex"."variant_options" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_variantoptions_options_order" varchar,
  	"variant_type_id" integer NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"swatch" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "laddex"."users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "laddex"."enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "laddex"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "laddex"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar,
  	"business_name" varchar,
  	"wholesale_status" "laddex"."enum_users_wholesale_status" DEFAULT 'none',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "laddex"."transactions_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"variant_id" integer,
  	"quantity" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "laddex"."transactions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"billing_address_title" varchar,
  	"billing_address_first_name" varchar,
  	"billing_address_last_name" varchar,
  	"billing_address_company" varchar,
  	"billing_address_address_line1" varchar,
  	"billing_address_address_line2" varchar,
  	"billing_address_city" varchar,
  	"billing_address_state" varchar,
  	"billing_address_postal_code" varchar,
  	"billing_address_country" varchar,
  	"billing_address_phone" varchar,
  	"status" "laddex"."enum_transactions_status" DEFAULT 'pending' NOT NULL,
  	"customer_id" integer,
  	"customer_email" varchar,
  	"order_id" integer,
  	"cart_id" integer,
  	"amount" numeric,
  	"currency" "laddex"."enum_transactions_currency" DEFAULT 'USD',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."checkout_sessions_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"variant_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"quantity" numeric NOT NULL,
  	"unit_price_kobo" numeric NOT NULL,
  	"line_total_kobo" numeric NOT NULL
  );
  
  CREATE TABLE "laddex"."checkout_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"authorization_url" varchar,
  	"cart_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"address_street" varchar,
  	"address_landmark" varchar,
  	"address_notes" varchar,
  	"address_location_label" varchar,
  	"address_state" varchar,
  	"address_lga" varchar,
  	"address_lng" numeric,
  	"address_lat" numeric,
  	"fulfilment" "laddex"."enum_checkout_sessions_fulfilment" NOT NULL,
  	"goods_total_kobo" numeric NOT NULL,
  	"delivery_total_kobo" numeric NOT NULL,
  	"grand_total_kobo" numeric NOT NULL,
  	"fee_basis" "laddex"."enum_checkout_sessions_fee_basis" NOT NULL,
  	"currency" "laddex"."enum_checkout_sessions_currency" DEFAULT 'NGN' NOT NULL,
  	"status" "laddex"."enum_checkout_sessions_status" DEFAULT 'created' NOT NULL,
  	"order_id" integer,
  	"failure_reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."delivery_zones_bands" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"up_to_kg" numeric NOT NULL,
  	"fee_kobo" numeric NOT NULL
  );
  
  CREATE TABLE "laddex"."delivery_zones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"region_id" "laddex"."enum_delivery_zones_region_id" NOT NULL,
  	"name" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."distribution_points" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"address" varchar,
  	"lng" numeric NOT NULL,
  	"lat" numeric NOT NULL,
  	"opening_hours" varchar,
  	"phone" varchar,
  	"verified" boolean DEFAULT false,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."wholesale_applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"business_name" varchar NOT NULL,
  	"business_type" "laddex"."enum_wholesale_applications_business_type" NOT NULL,
  	"contact_name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"state" varchar,
  	"message" varchar,
  	"status" "laddex"."enum_wholesale_applications_status" DEFAULT 'pending',
  	"reviewer_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."quote_requests_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant_sku" varchar NOT NULL,
  	"qty" numeric NOT NULL
  );
  
  CREATE TABLE "laddex"."quote_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contact_name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"business_name" varchar,
  	"note" varchar,
  	"status" "laddex"."enum_quote_requests_status" DEFAULT 'new',
  	"staff_price_kobo" numeric,
  	"staff_response" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."addresses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer,
  	"title" varchar,
  	"first_name" varchar,
  	"last_name" varchar,
  	"company" varchar,
  	"address_line1" varchar,
  	"address_line2" varchar,
  	"city" varchar,
  	"state" varchar,
  	"postal_code" varchar,
  	"country" "laddex"."enum_addresses_country" NOT NULL,
  	"phone" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "laddex"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer,
  	"orders_id" integer,
  	"carts_id" integer,
  	"pages_id" integer,
  	"category_id" integer,
  	"media_id" integer,
  	"seo_media_id" integer,
  	"gallery_media_id" integer,
  	"reviews_id" integer,
  	"variants_id" integer,
  	"variant_types_id" integer,
  	"variant_options_id" integer,
  	"users_id" integer,
  	"transactions_id" integer,
  	"checkout_sessions_id" integer,
  	"delivery_zones_id" integer,
  	"distribution_points_id" integer,
  	"wholesale_applications_id" integer,
  	"quote_requests_id" integer,
  	"addresses_id" integer
  );
  
  CREATE TABLE "laddex"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "laddex"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "laddex"."site_settings_header_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "laddex"."enum_site_settings_header_nav_items_link_type" DEFAULT 'reference',
  	"link_url" varchar,
  	"link_label" varchar NOT NULL,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "laddex"."site_settings_blocks_footer_nav_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "laddex"."enum_site_settings_blocks_footer_nav_links_link_type" DEFAULT 'reference',
  	"link_url" varchar,
  	"link_label" varchar NOT NULL,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "laddex"."site_settings_blocks_footer_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."site_settings_blocks_content_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" "laddex"."enum_site_settings_blocks_content_columns_size" DEFAULT 'full' NOT NULL,
  	"rich_text" jsonb,
  	"enable_link" boolean,
  	"link_type" "laddex"."enum_site_settings_blocks_content_columns_link_type" DEFAULT 'reference',
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "laddex"."site_settings_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."site_settings_blocks_footer_icons_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "laddex"."enum_site_settings_blocks_footer_icons_items_icon" NOT NULL,
  	"link_type" "laddex"."enum_site_settings_blocks_footer_icons_items_link_type" DEFAULT 'reference',
  	"link_url" varchar,
  	"link_label" varchar NOT NULL,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "laddex"."site_settings_blocks_footer_icons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "laddex"."site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"general_logo_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "laddex"."site_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"products_id" integer,
  	"category_id" integer
  );
  
  ALTER TABLE "laddex"."products_gallery" ADD CONSTRAINT "products_gallery_image_id_gallery_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "laddex"."gallery_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."products_gallery" ADD CONSTRAINT "products_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."products_faqs" ADD CONSTRAINT "products_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."products_laddex_details" ADD CONSTRAINT "products_laddex_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."products_laddex_specs" ADD CONSTRAINT "products_laddex_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."products_laddex_packaging_notes" ADD CONSTRAINT "products_laddex_packaging_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."products_laddex_usage" ADD CONSTRAINT "products_laddex_usage_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."products" ADD CONSTRAINT "products_meta_image_id_seo_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "laddex"."seo_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."products_rels" ADD CONSTRAINT "products_rels_category_fk" FOREIGN KEY ("category_id") REFERENCES "laddex"."category"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."products_rels" ADD CONSTRAINT "products_rels_variant_types_fk" FOREIGN KEY ("variant_types_id") REFERENCES "laddex"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v_version_gallery" ADD CONSTRAINT "_products_v_version_gallery_image_id_gallery_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "laddex"."gallery_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v_version_gallery" ADD CONSTRAINT "_products_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v_version_faqs" ADD CONSTRAINT "_products_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v_version_laddex_details" ADD CONSTRAINT "_products_v_version_laddex_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v_version_laddex_specs" ADD CONSTRAINT "_products_v_version_laddex_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v_version_laddex_packaging_notes" ADD CONSTRAINT "_products_v_version_laddex_packaging_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v_version_laddex_usage" ADD CONSTRAINT "_products_v_version_laddex_usage_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v" ADD CONSTRAINT "_products_v_version_meta_image_id_seo_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "laddex"."seo_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v_rels" ADD CONSTRAINT "_products_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v_rels" ADD CONSTRAINT "_products_v_rels_category_fk" FOREIGN KEY ("category_id") REFERENCES "laddex"."category"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v_rels" ADD CONSTRAINT "_products_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_products_v_rels" ADD CONSTRAINT "_products_v_rels_variant_types_fk" FOREIGN KEY ("variant_types_id") REFERENCES "laddex"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "laddex"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."orders_items" ADD CONSTRAINT "orders_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "laddex"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "laddex"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."orders" ADD CONSTRAINT "orders_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "laddex"."carts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."orders" ADD CONSTRAINT "orders_checkout_session_id_checkout_sessions_id_fk" FOREIGN KEY ("checkout_session_id") REFERENCES "laddex"."checkout_sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."carts_items" ADD CONSTRAINT "carts_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "laddex"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."carts_items" ADD CONSTRAINT "carts_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "laddex"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."carts_items" ADD CONSTRAINT "carts_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."carts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."carts" ADD CONSTRAINT "carts_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "laddex"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."pages_hero_links" ADD CONSTRAINT "pages_hero_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_blocks_cta_links" ADD CONSTRAINT "pages_blocks_cta_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."pages_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_blocks_archive" ADD CONSTRAINT "pages_blocks_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_blocks_faq_faqs" ADD CONSTRAINT "pages_blocks_faq_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_blocks_content_columns" ADD CONSTRAINT "pages_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."pages_blocks_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_blocks_content" ADD CONSTRAINT "pages_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_blocks_gallery_images" ADD CONSTRAINT "pages_blocks_gallery_images_image_id_gallery_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "laddex"."gallery_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."pages_blocks_gallery_images" ADD CONSTRAINT "pages_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."pages_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_blocks_gallery" ADD CONSTRAINT "pages_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_blocks_html_embed" ADD CONSTRAINT "pages_blocks_html_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages" ADD CONSTRAINT "pages_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "laddex"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."pages" ADD CONSTRAINT "pages_meta_image_id_seo_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "laddex"."seo_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_rels" ADD CONSTRAINT "pages_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "laddex"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_rels" ADD CONSTRAINT "pages_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."pages_rels" ADD CONSTRAINT "pages_rels_category_fk" FOREIGN KEY ("category_id") REFERENCES "laddex"."category"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_version_hero_links" ADD CONSTRAINT "_pages_v_version_hero_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_blocks_cta_links" ADD CONSTRAINT "_pages_v_blocks_cta_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_pages_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_blocks_archive" ADD CONSTRAINT "_pages_v_blocks_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_blocks_faq_faqs" ADD CONSTRAINT "_pages_v_blocks_faq_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_blocks_content_columns" ADD CONSTRAINT "_pages_v_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_pages_v_blocks_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_blocks_content" ADD CONSTRAINT "_pages_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_blocks_gallery_images" ADD CONSTRAINT "_pages_v_blocks_gallery_images_image_id_gallery_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "laddex"."gallery_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_blocks_gallery_images" ADD CONSTRAINT "_pages_v_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_pages_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_blocks_gallery" ADD CONSTRAINT "_pages_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_blocks_html_embed" ADD CONSTRAINT "_pages_v_blocks_html_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v" ADD CONSTRAINT "_pages_v_version_hero_media_id_media_id_fk" FOREIGN KEY ("version_hero_media_id") REFERENCES "laddex"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_seo_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "laddex"."seo_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "laddex"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_category_fk" FOREIGN KEY ("category_id") REFERENCES "laddex"."category"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."category_faqs" ADD CONSTRAINT "category_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."category"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."category" ADD CONSTRAINT "category_meta_image_id_seo_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "laddex"."seo_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."_category_v_version_faqs" ADD CONSTRAINT "_category_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_category_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_category_v" ADD CONSTRAINT "_category_v_parent_id_category_id_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."category"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."_category_v" ADD CONSTRAINT "_category_v_version_meta_image_id_seo_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "laddex"."seo_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "laddex"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."variants_laddex_wholesale_tiers" ADD CONSTRAINT "variants_laddex_wholesale_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "laddex"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."variants_rels" ADD CONSTRAINT "variants_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."variants_rels" ADD CONSTRAINT "variants_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "laddex"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_variants_v_version_laddex_wholesale_tiers" ADD CONSTRAINT "_variants_v_version_laddex_wholesale_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."_variants_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_variants_v" ADD CONSTRAINT "_variants_v_parent_id_variants_id_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."_variants_v" ADD CONSTRAINT "_variants_v_version_product_id_products_id_fk" FOREIGN KEY ("version_product_id") REFERENCES "laddex"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."_variants_v_rels" ADD CONSTRAINT "_variants_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."_variants_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."_variants_v_rels" ADD CONSTRAINT "_variants_v_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "laddex"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."variant_options" ADD CONSTRAINT "variant_options_variant_type_id_variant_types_id_fk" FOREIGN KEY ("variant_type_id") REFERENCES "laddex"."variant_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."transactions_items" ADD CONSTRAINT "transactions_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "laddex"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."transactions_items" ADD CONSTRAINT "transactions_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "laddex"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."transactions_items" ADD CONSTRAINT "transactions_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."transactions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."transactions" ADD CONSTRAINT "transactions_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "laddex"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "laddex"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."transactions" ADD CONSTRAINT "transactions_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "laddex"."carts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."checkout_sessions_lines" ADD CONSTRAINT "checkout_sessions_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "laddex"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."checkout_sessions_lines" ADD CONSTRAINT "checkout_sessions_lines_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "laddex"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."checkout_sessions_lines" ADD CONSTRAINT "checkout_sessions_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."checkout_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."checkout_sessions" ADD CONSTRAINT "checkout_sessions_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "laddex"."carts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."checkout_sessions" ADD CONSTRAINT "checkout_sessions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "laddex"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."delivery_zones_bands" ADD CONSTRAINT "delivery_zones_bands_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."delivery_zones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."quote_requests_lines" ADD CONSTRAINT "quote_requests_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."addresses" ADD CONSTRAINT "addresses_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "laddex"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "laddex"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_carts_fk" FOREIGN KEY ("carts_id") REFERENCES "laddex"."carts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "laddex"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_category_fk" FOREIGN KEY ("category_id") REFERENCES "laddex"."category"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "laddex"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_seo_media_fk" FOREIGN KEY ("seo_media_id") REFERENCES "laddex"."seo_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_media_fk" FOREIGN KEY ("gallery_media_id") REFERENCES "laddex"."gallery_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "laddex"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variants_fk" FOREIGN KEY ("variants_id") REFERENCES "laddex"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variant_types_fk" FOREIGN KEY ("variant_types_id") REFERENCES "laddex"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "laddex"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "laddex"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_transactions_fk" FOREIGN KEY ("transactions_id") REFERENCES "laddex"."transactions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_checkout_sessions_fk" FOREIGN KEY ("checkout_sessions_id") REFERENCES "laddex"."checkout_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_delivery_zones_fk" FOREIGN KEY ("delivery_zones_id") REFERENCES "laddex"."delivery_zones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_distribution_points_fk" FOREIGN KEY ("distribution_points_id") REFERENCES "laddex"."distribution_points"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_wholesale_applications_fk" FOREIGN KEY ("wholesale_applications_id") REFERENCES "laddex"."wholesale_applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quote_requests_fk" FOREIGN KEY ("quote_requests_id") REFERENCES "laddex"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_addresses_fk" FOREIGN KEY ("addresses_id") REFERENCES "laddex"."addresses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "laddex"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."site_settings_header_nav_items" ADD CONSTRAINT "site_settings_header_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."site_settings_blocks_footer_nav_links" ADD CONSTRAINT "site_settings_blocks_footer_nav_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."site_settings_blocks_footer_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."site_settings_blocks_footer_nav" ADD CONSTRAINT "site_settings_blocks_footer_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."site_settings_blocks_content_columns" ADD CONSTRAINT "site_settings_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."site_settings_blocks_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."site_settings_blocks_content" ADD CONSTRAINT "site_settings_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."site_settings_blocks_footer_icons_items" ADD CONSTRAINT "site_settings_blocks_footer_icons_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."site_settings_blocks_footer_icons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."site_settings_blocks_footer_icons" ADD CONSTRAINT "site_settings_blocks_footer_icons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "laddex"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."site_settings" ADD CONSTRAINT "site_settings_general_logo_id_media_id_fk" FOREIGN KEY ("general_logo_id") REFERENCES "laddex"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."site_settings_rels" ADD CONSTRAINT "site_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "laddex"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."site_settings_rels" ADD CONSTRAINT "site_settings_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "laddex"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."site_settings_rels" ADD CONSTRAINT "site_settings_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "laddex"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "laddex"."site_settings_rels" ADD CONSTRAINT "site_settings_rels_category_fk" FOREIGN KEY ("category_id") REFERENCES "laddex"."category"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_gallery_order_idx" ON "laddex"."products_gallery" USING btree ("_order");
  CREATE INDEX "products_gallery_parent_id_idx" ON "laddex"."products_gallery" USING btree ("_parent_id");
  CREATE INDEX "products_gallery_image_idx" ON "laddex"."products_gallery" USING btree ("image_id");
  CREATE INDEX "products_faqs_order_idx" ON "laddex"."products_faqs" USING btree ("_order");
  CREATE INDEX "products_faqs_parent_id_idx" ON "laddex"."products_faqs" USING btree ("_parent_id");
  CREATE INDEX "products_laddex_details_order_idx" ON "laddex"."products_laddex_details" USING btree ("_order");
  CREATE INDEX "products_laddex_details_parent_id_idx" ON "laddex"."products_laddex_details" USING btree ("_parent_id");
  CREATE INDEX "products_laddex_specs_order_idx" ON "laddex"."products_laddex_specs" USING btree ("_order");
  CREATE INDEX "products_laddex_specs_parent_id_idx" ON "laddex"."products_laddex_specs" USING btree ("_parent_id");
  CREATE INDEX "products_laddex_packaging_notes_order_idx" ON "laddex"."products_laddex_packaging_notes" USING btree ("_order");
  CREATE INDEX "products_laddex_packaging_notes_parent_id_idx" ON "laddex"."products_laddex_packaging_notes" USING btree ("_parent_id");
  CREATE INDEX "products_laddex_usage_order_idx" ON "laddex"."products_laddex_usage" USING btree ("_order");
  CREATE INDEX "products_laddex_usage_parent_id_idx" ON "laddex"."products_laddex_usage" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "products_slug_idx" ON "laddex"."products" USING btree ("slug");
  CREATE INDEX "products_meta_meta_image_idx" ON "laddex"."products" USING btree ("meta_image_id");
  CREATE INDEX "products_updated_at_idx" ON "laddex"."products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "laddex"."products" USING btree ("created_at");
  CREATE INDEX "products_deleted_at_idx" ON "laddex"."products" USING btree ("deleted_at");
  CREATE INDEX "products__status_idx" ON "laddex"."products" USING btree ("_status");
  CREATE INDEX "products_rels_order_idx" ON "laddex"."products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "laddex"."products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "laddex"."products_rels" USING btree ("path");
  CREATE INDEX "products_rels_category_id_idx" ON "laddex"."products_rels" USING btree ("category_id");
  CREATE INDEX "products_rels_products_id_idx" ON "laddex"."products_rels" USING btree ("products_id");
  CREATE INDEX "products_rels_variant_types_id_idx" ON "laddex"."products_rels" USING btree ("variant_types_id");
  CREATE INDEX "_products_v_version_gallery_order_idx" ON "laddex"."_products_v_version_gallery" USING btree ("_order");
  CREATE INDEX "_products_v_version_gallery_parent_id_idx" ON "laddex"."_products_v_version_gallery" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_gallery_image_idx" ON "laddex"."_products_v_version_gallery" USING btree ("image_id");
  CREATE INDEX "_products_v_version_faqs_order_idx" ON "laddex"."_products_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_products_v_version_faqs_parent_id_idx" ON "laddex"."_products_v_version_faqs" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_laddex_details_order_idx" ON "laddex"."_products_v_version_laddex_details" USING btree ("_order");
  CREATE INDEX "_products_v_version_laddex_details_parent_id_idx" ON "laddex"."_products_v_version_laddex_details" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_laddex_specs_order_idx" ON "laddex"."_products_v_version_laddex_specs" USING btree ("_order");
  CREATE INDEX "_products_v_version_laddex_specs_parent_id_idx" ON "laddex"."_products_v_version_laddex_specs" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_laddex_packaging_notes_order_idx" ON "laddex"."_products_v_version_laddex_packaging_notes" USING btree ("_order");
  CREATE INDEX "_products_v_version_laddex_packaging_notes_parent_id_idx" ON "laddex"."_products_v_version_laddex_packaging_notes" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_laddex_usage_order_idx" ON "laddex"."_products_v_version_laddex_usage" USING btree ("_order");
  CREATE INDEX "_products_v_version_laddex_usage_parent_id_idx" ON "laddex"."_products_v_version_laddex_usage" USING btree ("_parent_id");
  CREATE INDEX "_products_v_parent_idx" ON "laddex"."_products_v" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_version_slug_idx" ON "laddex"."_products_v" USING btree ("version_slug");
  CREATE INDEX "_products_v_version_meta_version_meta_image_idx" ON "laddex"."_products_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_products_v_version_version_updated_at_idx" ON "laddex"."_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_products_v_version_version_created_at_idx" ON "laddex"."_products_v" USING btree ("version_created_at");
  CREATE INDEX "_products_v_version_version_deleted_at_idx" ON "laddex"."_products_v" USING btree ("version_deleted_at");
  CREATE INDEX "_products_v_version_version__status_idx" ON "laddex"."_products_v" USING btree ("version__status");
  CREATE INDEX "_products_v_created_at_idx" ON "laddex"."_products_v" USING btree ("created_at");
  CREATE INDEX "_products_v_updated_at_idx" ON "laddex"."_products_v" USING btree ("updated_at");
  CREATE INDEX "_products_v_latest_idx" ON "laddex"."_products_v" USING btree ("latest");
  CREATE INDEX "_products_v_autosave_idx" ON "laddex"."_products_v" USING btree ("autosave");
  CREATE INDEX "_products_v_rels_order_idx" ON "laddex"."_products_v_rels" USING btree ("order");
  CREATE INDEX "_products_v_rels_parent_idx" ON "laddex"."_products_v_rels" USING btree ("parent_id");
  CREATE INDEX "_products_v_rels_path_idx" ON "laddex"."_products_v_rels" USING btree ("path");
  CREATE INDEX "_products_v_rels_category_id_idx" ON "laddex"."_products_v_rels" USING btree ("category_id");
  CREATE INDEX "_products_v_rels_products_id_idx" ON "laddex"."_products_v_rels" USING btree ("products_id");
  CREATE INDEX "_products_v_rels_variant_types_id_idx" ON "laddex"."_products_v_rels" USING btree ("variant_types_id");
  CREATE INDEX "orders_items_order_idx" ON "laddex"."orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "laddex"."orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "laddex"."orders_items" USING btree ("product_id");
  CREATE INDEX "orders_items_variant_idx" ON "laddex"."orders_items" USING btree ("variant_id");
  CREATE INDEX "orders_customer_idx" ON "laddex"."orders" USING btree ("customer_id");
  CREATE INDEX "orders_cart_idx" ON "laddex"."orders" USING btree ("cart_id");
  CREATE UNIQUE INDEX "orders_checkout_session_idx" ON "laddex"."orders" USING btree ("checkout_session_id");
  CREATE UNIQUE INDEX "orders_payment_intent_id_idx" ON "laddex"."orders" USING btree ("payment_intent_id");
  CREATE INDEX "orders_updated_at_idx" ON "laddex"."orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "laddex"."orders" USING btree ("created_at");
  CREATE INDEX "carts_items_order_idx" ON "laddex"."carts_items" USING btree ("_order");
  CREATE INDEX "carts_items_parent_id_idx" ON "laddex"."carts_items" USING btree ("_parent_id");
  CREATE INDEX "carts_items_product_idx" ON "laddex"."carts_items" USING btree ("product_id");
  CREATE INDEX "carts_items_variant_idx" ON "laddex"."carts_items" USING btree ("variant_id");
  CREATE INDEX "carts_secret_idx" ON "laddex"."carts" USING btree ("secret");
  CREATE INDEX "carts_customer_idx" ON "laddex"."carts" USING btree ("customer_id");
  CREATE INDEX "carts_updated_at_idx" ON "laddex"."carts" USING btree ("updated_at");
  CREATE INDEX "carts_created_at_idx" ON "laddex"."carts" USING btree ("created_at");
  CREATE INDEX "pages_hero_links_order_idx" ON "laddex"."pages_hero_links" USING btree ("_order");
  CREATE INDEX "pages_hero_links_parent_id_idx" ON "laddex"."pages_hero_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_links_order_idx" ON "laddex"."pages_blocks_cta_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_links_parent_id_idx" ON "laddex"."pages_blocks_cta_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "laddex"."pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "laddex"."pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "laddex"."pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_archive_order_idx" ON "laddex"."pages_blocks_archive" USING btree ("_order");
  CREATE INDEX "pages_blocks_archive_parent_id_idx" ON "laddex"."pages_blocks_archive" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_archive_path_idx" ON "laddex"."pages_blocks_archive" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_faqs_order_idx" ON "laddex"."pages_blocks_faq_faqs" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_faqs_parent_id_idx" ON "laddex"."pages_blocks_faq_faqs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "laddex"."pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "laddex"."pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "laddex"."pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_content_columns_order_idx" ON "laddex"."pages_blocks_content_columns" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_columns_parent_id_idx" ON "laddex"."pages_blocks_content_columns" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_order_idx" ON "laddex"."pages_blocks_content" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_parent_id_idx" ON "laddex"."pages_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_path_idx" ON "laddex"."pages_blocks_content" USING btree ("_path");
  CREATE INDEX "pages_blocks_gallery_images_order_idx" ON "laddex"."pages_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_images_parent_id_idx" ON "laddex"."pages_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_images_image_idx" ON "laddex"."pages_blocks_gallery_images" USING btree ("image_id");
  CREATE INDEX "pages_blocks_gallery_order_idx" ON "laddex"."pages_blocks_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_parent_id_idx" ON "laddex"."pages_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_path_idx" ON "laddex"."pages_blocks_gallery" USING btree ("_path");
  CREATE INDEX "pages_blocks_html_embed_order_idx" ON "laddex"."pages_blocks_html_embed" USING btree ("_order");
  CREATE INDEX "pages_blocks_html_embed_parent_id_idx" ON "laddex"."pages_blocks_html_embed" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_html_embed_path_idx" ON "laddex"."pages_blocks_html_embed" USING btree ("_path");
  CREATE INDEX "pages_hero_hero_media_idx" ON "laddex"."pages" USING btree ("hero_media_id");
  CREATE INDEX "pages_meta_meta_image_idx" ON "laddex"."pages" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "laddex"."pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "laddex"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "laddex"."pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "laddex"."pages" USING btree ("_status");
  CREATE INDEX "pages_rels_order_idx" ON "laddex"."pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "laddex"."pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "laddex"."pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_pages_id_idx" ON "laddex"."pages_rels" USING btree ("pages_id");
  CREATE INDEX "pages_rels_products_id_idx" ON "laddex"."pages_rels" USING btree ("products_id");
  CREATE INDEX "pages_rels_category_id_idx" ON "laddex"."pages_rels" USING btree ("category_id");
  CREATE INDEX "_pages_v_version_hero_links_order_idx" ON "laddex"."_pages_v_version_hero_links" USING btree ("_order");
  CREATE INDEX "_pages_v_version_hero_links_parent_id_idx" ON "laddex"."_pages_v_version_hero_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_links_order_idx" ON "laddex"."_pages_v_blocks_cta_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_links_parent_id_idx" ON "laddex"."_pages_v_blocks_cta_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "laddex"."_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "laddex"."_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "laddex"."_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_archive_order_idx" ON "laddex"."_pages_v_blocks_archive" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_archive_parent_id_idx" ON "laddex"."_pages_v_blocks_archive" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_archive_path_idx" ON "laddex"."_pages_v_blocks_archive" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faq_faqs_order_idx" ON "laddex"."_pages_v_blocks_faq_faqs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_faqs_parent_id_idx" ON "laddex"."_pages_v_blocks_faq_faqs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "laddex"."_pages_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "laddex"."_pages_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "laddex"."_pages_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_content_columns_order_idx" ON "laddex"."_pages_v_blocks_content_columns" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_columns_parent_id_idx" ON "laddex"."_pages_v_blocks_content_columns" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_order_idx" ON "laddex"."_pages_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_parent_id_idx" ON "laddex"."_pages_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_path_idx" ON "laddex"."_pages_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_gallery_images_order_idx" ON "laddex"."_pages_v_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_images_parent_id_idx" ON "laddex"."_pages_v_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_images_image_idx" ON "laddex"."_pages_v_blocks_gallery_images" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_gallery_order_idx" ON "laddex"."_pages_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_parent_id_idx" ON "laddex"."_pages_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_path_idx" ON "laddex"."_pages_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_html_embed_order_idx" ON "laddex"."_pages_v_blocks_html_embed" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_html_embed_parent_id_idx" ON "laddex"."_pages_v_blocks_html_embed" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_html_embed_path_idx" ON "laddex"."_pages_v_blocks_html_embed" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "laddex"."_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_hero_version_hero_media_idx" ON "laddex"."_pages_v" USING btree ("version_hero_media_id");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "laddex"."_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "laddex"."_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "laddex"."_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "laddex"."_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "laddex"."_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "laddex"."_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "laddex"."_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "laddex"."_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "laddex"."_pages_v" USING btree ("autosave");
  CREATE INDEX "_pages_v_rels_order_idx" ON "laddex"."_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "laddex"."_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "laddex"."_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_pages_id_idx" ON "laddex"."_pages_v_rels" USING btree ("pages_id");
  CREATE INDEX "_pages_v_rels_products_id_idx" ON "laddex"."_pages_v_rels" USING btree ("products_id");
  CREATE INDEX "_pages_v_rels_category_id_idx" ON "laddex"."_pages_v_rels" USING btree ("category_id");
  CREATE INDEX "category_faqs_order_idx" ON "laddex"."category_faqs" USING btree ("_order");
  CREATE INDEX "category_faqs_parent_id_idx" ON "laddex"."category_faqs" USING btree ("_parent_id");
  CREATE INDEX "category_meta_meta_image_idx" ON "laddex"."category" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "category_slug_idx" ON "laddex"."category" USING btree ("slug");
  CREATE INDEX "category_updated_at_idx" ON "laddex"."category" USING btree ("updated_at");
  CREATE INDEX "category_created_at_idx" ON "laddex"."category" USING btree ("created_at");
  CREATE INDEX "category__status_idx" ON "laddex"."category" USING btree ("_status");
  CREATE INDEX "_category_v_version_faqs_order_idx" ON "laddex"."_category_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_category_v_version_faqs_parent_id_idx" ON "laddex"."_category_v_version_faqs" USING btree ("_parent_id");
  CREATE INDEX "_category_v_parent_idx" ON "laddex"."_category_v" USING btree ("parent_id");
  CREATE INDEX "_category_v_version_meta_version_meta_image_idx" ON "laddex"."_category_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_category_v_version_version_slug_idx" ON "laddex"."_category_v" USING btree ("version_slug");
  CREATE INDEX "_category_v_version_version_updated_at_idx" ON "laddex"."_category_v" USING btree ("version_updated_at");
  CREATE INDEX "_category_v_version_version_created_at_idx" ON "laddex"."_category_v" USING btree ("version_created_at");
  CREATE INDEX "_category_v_version_version__status_idx" ON "laddex"."_category_v" USING btree ("version__status");
  CREATE INDEX "_category_v_created_at_idx" ON "laddex"."_category_v" USING btree ("created_at");
  CREATE INDEX "_category_v_updated_at_idx" ON "laddex"."_category_v" USING btree ("updated_at");
  CREATE INDEX "_category_v_latest_idx" ON "laddex"."_category_v" USING btree ("latest");
  CREATE INDEX "media_updated_at_idx" ON "laddex"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "laddex"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "laddex"."media" USING btree ("filename");
  CREATE INDEX "seo_media_updated_at_idx" ON "laddex"."seo_media" USING btree ("updated_at");
  CREATE INDEX "seo_media_created_at_idx" ON "laddex"."seo_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "seo_media_filename_idx" ON "laddex"."seo_media" USING btree ("filename");
  CREATE INDEX "seo_media_sizes_card_sizes_card_filename_idx" ON "laddex"."seo_media" USING btree ("sizes_card_filename");
  CREATE INDEX "seo_media_sizes_og_sizes_og_filename_idx" ON "laddex"."seo_media" USING btree ("sizes_og_filename");
  CREATE INDEX "gallery_media_updated_at_idx" ON "laddex"."gallery_media" USING btree ("updated_at");
  CREATE INDEX "gallery_media_created_at_idx" ON "laddex"."gallery_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "gallery_media_filename_idx" ON "laddex"."gallery_media" USING btree ("filename");
  CREATE INDEX "gallery_media_sizes_gallery_sizes_gallery_filename_idx" ON "laddex"."gallery_media" USING btree ("sizes_gallery_filename");
  CREATE INDEX "reviews_product_idx" ON "laddex"."reviews" USING btree ("product_id");
  CREATE INDEX "reviews_updated_at_idx" ON "laddex"."reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "laddex"."reviews" USING btree ("created_at");
  CREATE INDEX "variants_laddex_wholesale_tiers_order_idx" ON "laddex"."variants_laddex_wholesale_tiers" USING btree ("_order");
  CREATE INDEX "variants_laddex_wholesale_tiers_parent_id_idx" ON "laddex"."variants_laddex_wholesale_tiers" USING btree ("_parent_id");
  CREATE INDEX "variants_product_idx" ON "laddex"."variants" USING btree ("product_id");
  CREATE INDEX "variants_updated_at_idx" ON "laddex"."variants" USING btree ("updated_at");
  CREATE INDEX "variants_created_at_idx" ON "laddex"."variants" USING btree ("created_at");
  CREATE INDEX "variants_deleted_at_idx" ON "laddex"."variants" USING btree ("deleted_at");
  CREATE INDEX "variants__status_idx" ON "laddex"."variants" USING btree ("_status");
  CREATE INDEX "variants_rels_order_idx" ON "laddex"."variants_rels" USING btree ("order");
  CREATE INDEX "variants_rels_parent_idx" ON "laddex"."variants_rels" USING btree ("parent_id");
  CREATE INDEX "variants_rels_path_idx" ON "laddex"."variants_rels" USING btree ("path");
  CREATE INDEX "variants_rels_variant_options_id_idx" ON "laddex"."variants_rels" USING btree ("variant_options_id");
  CREATE INDEX "_variants_v_version_laddex_wholesale_tiers_order_idx" ON "laddex"."_variants_v_version_laddex_wholesale_tiers" USING btree ("_order");
  CREATE INDEX "_variants_v_version_laddex_wholesale_tiers_parent_id_idx" ON "laddex"."_variants_v_version_laddex_wholesale_tiers" USING btree ("_parent_id");
  CREATE INDEX "_variants_v_parent_idx" ON "laddex"."_variants_v" USING btree ("parent_id");
  CREATE INDEX "_variants_v_version_version_product_idx" ON "laddex"."_variants_v" USING btree ("version_product_id");
  CREATE INDEX "_variants_v_version_version_updated_at_idx" ON "laddex"."_variants_v" USING btree ("version_updated_at");
  CREATE INDEX "_variants_v_version_version_created_at_idx" ON "laddex"."_variants_v" USING btree ("version_created_at");
  CREATE INDEX "_variants_v_version_version_deleted_at_idx" ON "laddex"."_variants_v" USING btree ("version_deleted_at");
  CREATE INDEX "_variants_v_version_version__status_idx" ON "laddex"."_variants_v" USING btree ("version__status");
  CREATE INDEX "_variants_v_created_at_idx" ON "laddex"."_variants_v" USING btree ("created_at");
  CREATE INDEX "_variants_v_updated_at_idx" ON "laddex"."_variants_v" USING btree ("updated_at");
  CREATE INDEX "_variants_v_latest_idx" ON "laddex"."_variants_v" USING btree ("latest");
  CREATE INDEX "_variants_v_autosave_idx" ON "laddex"."_variants_v" USING btree ("autosave");
  CREATE INDEX "_variants_v_rels_order_idx" ON "laddex"."_variants_v_rels" USING btree ("order");
  CREATE INDEX "_variants_v_rels_parent_idx" ON "laddex"."_variants_v_rels" USING btree ("parent_id");
  CREATE INDEX "_variants_v_rels_path_idx" ON "laddex"."_variants_v_rels" USING btree ("path");
  CREATE INDEX "_variants_v_rels_variant_options_id_idx" ON "laddex"."_variants_v_rels" USING btree ("variant_options_id");
  CREATE INDEX "variant_types_updated_at_idx" ON "laddex"."variant_types" USING btree ("updated_at");
  CREATE INDEX "variant_types_created_at_idx" ON "laddex"."variant_types" USING btree ("created_at");
  CREATE INDEX "variant_types_deleted_at_idx" ON "laddex"."variant_types" USING btree ("deleted_at");
  CREATE INDEX "variant_options__variantoptions_options_order_idx" ON "laddex"."variant_options" USING btree ("_variantoptions_options_order");
  CREATE INDEX "variant_options_variant_type_idx" ON "laddex"."variant_options" USING btree ("variant_type_id");
  CREATE INDEX "variant_options_updated_at_idx" ON "laddex"."variant_options" USING btree ("updated_at");
  CREATE INDEX "variant_options_created_at_idx" ON "laddex"."variant_options" USING btree ("created_at");
  CREATE INDEX "variant_options_deleted_at_idx" ON "laddex"."variant_options" USING btree ("deleted_at");
  CREATE INDEX "users_roles_order_idx" ON "laddex"."users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "laddex"."users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "laddex"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "laddex"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "laddex"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "laddex"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "laddex"."users" USING btree ("email");
  CREATE INDEX "transactions_items_order_idx" ON "laddex"."transactions_items" USING btree ("_order");
  CREATE INDEX "transactions_items_parent_id_idx" ON "laddex"."transactions_items" USING btree ("_parent_id");
  CREATE INDEX "transactions_items_product_idx" ON "laddex"."transactions_items" USING btree ("product_id");
  CREATE INDEX "transactions_items_variant_idx" ON "laddex"."transactions_items" USING btree ("variant_id");
  CREATE INDEX "transactions_customer_idx" ON "laddex"."transactions" USING btree ("customer_id");
  CREATE INDEX "transactions_order_idx" ON "laddex"."transactions" USING btree ("order_id");
  CREATE INDEX "transactions_cart_idx" ON "laddex"."transactions" USING btree ("cart_id");
  CREATE INDEX "transactions_updated_at_idx" ON "laddex"."transactions" USING btree ("updated_at");
  CREATE INDEX "transactions_created_at_idx" ON "laddex"."transactions" USING btree ("created_at");
  CREATE INDEX "checkout_sessions_lines_order_idx" ON "laddex"."checkout_sessions_lines" USING btree ("_order");
  CREATE INDEX "checkout_sessions_lines_parent_id_idx" ON "laddex"."checkout_sessions_lines" USING btree ("_parent_id");
  CREATE INDEX "checkout_sessions_lines_product_idx" ON "laddex"."checkout_sessions_lines" USING btree ("product_id");
  CREATE INDEX "checkout_sessions_lines_variant_idx" ON "laddex"."checkout_sessions_lines" USING btree ("variant_id");
  CREATE UNIQUE INDEX "checkout_sessions_reference_idx" ON "laddex"."checkout_sessions" USING btree ("reference");
  CREATE UNIQUE INDEX "checkout_sessions_idempotency_key_idx" ON "laddex"."checkout_sessions" USING btree ("idempotency_key");
  CREATE INDEX "checkout_sessions_cart_idx" ON "laddex"."checkout_sessions" USING btree ("cart_id");
  CREATE INDEX "checkout_sessions_order_idx" ON "laddex"."checkout_sessions" USING btree ("order_id");
  CREATE INDEX "checkout_sessions_updated_at_idx" ON "laddex"."checkout_sessions" USING btree ("updated_at");
  CREATE INDEX "checkout_sessions_created_at_idx" ON "laddex"."checkout_sessions" USING btree ("created_at");
  CREATE INDEX "delivery_zones_bands_order_idx" ON "laddex"."delivery_zones_bands" USING btree ("_order");
  CREATE INDEX "delivery_zones_bands_parent_id_idx" ON "laddex"."delivery_zones_bands" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "delivery_zones_region_id_idx" ON "laddex"."delivery_zones" USING btree ("region_id");
  CREATE INDEX "delivery_zones_updated_at_idx" ON "laddex"."delivery_zones" USING btree ("updated_at");
  CREATE INDEX "delivery_zones_created_at_idx" ON "laddex"."delivery_zones" USING btree ("created_at");
  CREATE INDEX "distribution_points_updated_at_idx" ON "laddex"."distribution_points" USING btree ("updated_at");
  CREATE INDEX "distribution_points_created_at_idx" ON "laddex"."distribution_points" USING btree ("created_at");
  CREATE INDEX "wholesale_applications_updated_at_idx" ON "laddex"."wholesale_applications" USING btree ("updated_at");
  CREATE INDEX "wholesale_applications_created_at_idx" ON "laddex"."wholesale_applications" USING btree ("created_at");
  CREATE INDEX "quote_requests_lines_order_idx" ON "laddex"."quote_requests_lines" USING btree ("_order");
  CREATE INDEX "quote_requests_lines_parent_id_idx" ON "laddex"."quote_requests_lines" USING btree ("_parent_id");
  CREATE INDEX "quote_requests_updated_at_idx" ON "laddex"."quote_requests" USING btree ("updated_at");
  CREATE INDEX "quote_requests_created_at_idx" ON "laddex"."quote_requests" USING btree ("created_at");
  CREATE INDEX "addresses_customer_idx" ON "laddex"."addresses" USING btree ("customer_id");
  CREATE INDEX "addresses_updated_at_idx" ON "laddex"."addresses" USING btree ("updated_at");
  CREATE INDEX "addresses_created_at_idx" ON "laddex"."addresses" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "laddex"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "laddex"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "laddex"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "laddex"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_carts_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("carts_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_category_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("category_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_seo_media_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("seo_media_id");
  CREATE INDEX "payload_locked_documents_rels_gallery_media_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("gallery_media_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_variants_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("variants_id");
  CREATE INDEX "payload_locked_documents_rels_variant_types_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("variant_types_id");
  CREATE INDEX "payload_locked_documents_rels_variant_options_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("variant_options_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_transactions_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("transactions_id");
  CREATE INDEX "payload_locked_documents_rels_checkout_sessions_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("checkout_sessions_id");
  CREATE INDEX "payload_locked_documents_rels_delivery_zones_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("delivery_zones_id");
  CREATE INDEX "payload_locked_documents_rels_distribution_points_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("distribution_points_id");
  CREATE INDEX "payload_locked_documents_rels_wholesale_applications_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("wholesale_applications_id");
  CREATE INDEX "payload_locked_documents_rels_quote_requests_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("quote_requests_id");
  CREATE INDEX "payload_locked_documents_rels_addresses_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("addresses_id");
  CREATE INDEX "payload_preferences_key_idx" ON "laddex"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "laddex"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "laddex"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "laddex"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "laddex"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "laddex"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "laddex"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "laddex"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "laddex"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_header_nav_items_order_idx" ON "laddex"."site_settings_header_nav_items" USING btree ("_order");
  CREATE INDEX "site_settings_header_nav_items_parent_id_idx" ON "laddex"."site_settings_header_nav_items" USING btree ("_parent_id");
  CREATE INDEX "site_settings_blocks_footer_nav_links_order_idx" ON "laddex"."site_settings_blocks_footer_nav_links" USING btree ("_order");
  CREATE INDEX "site_settings_blocks_footer_nav_links_parent_id_idx" ON "laddex"."site_settings_blocks_footer_nav_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_blocks_footer_nav_order_idx" ON "laddex"."site_settings_blocks_footer_nav" USING btree ("_order");
  CREATE INDEX "site_settings_blocks_footer_nav_parent_id_idx" ON "laddex"."site_settings_blocks_footer_nav" USING btree ("_parent_id");
  CREATE INDEX "site_settings_blocks_footer_nav_path_idx" ON "laddex"."site_settings_blocks_footer_nav" USING btree ("_path");
  CREATE INDEX "site_settings_blocks_content_columns_order_idx" ON "laddex"."site_settings_blocks_content_columns" USING btree ("_order");
  CREATE INDEX "site_settings_blocks_content_columns_parent_id_idx" ON "laddex"."site_settings_blocks_content_columns" USING btree ("_parent_id");
  CREATE INDEX "site_settings_blocks_content_order_idx" ON "laddex"."site_settings_blocks_content" USING btree ("_order");
  CREATE INDEX "site_settings_blocks_content_parent_id_idx" ON "laddex"."site_settings_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "site_settings_blocks_content_path_idx" ON "laddex"."site_settings_blocks_content" USING btree ("_path");
  CREATE INDEX "site_settings_blocks_footer_icons_items_order_idx" ON "laddex"."site_settings_blocks_footer_icons_items" USING btree ("_order");
  CREATE INDEX "site_settings_blocks_footer_icons_items_parent_id_idx" ON "laddex"."site_settings_blocks_footer_icons_items" USING btree ("_parent_id");
  CREATE INDEX "site_settings_blocks_footer_icons_order_idx" ON "laddex"."site_settings_blocks_footer_icons" USING btree ("_order");
  CREATE INDEX "site_settings_blocks_footer_icons_parent_id_idx" ON "laddex"."site_settings_blocks_footer_icons" USING btree ("_parent_id");
  CREATE INDEX "site_settings_blocks_footer_icons_path_idx" ON "laddex"."site_settings_blocks_footer_icons" USING btree ("_path");
  CREATE INDEX "site_settings_general_general_logo_idx" ON "laddex"."site_settings" USING btree ("general_logo_id");
  CREATE INDEX "site_settings_rels_order_idx" ON "laddex"."site_settings_rels" USING btree ("order");
  CREATE INDEX "site_settings_rels_parent_idx" ON "laddex"."site_settings_rels" USING btree ("parent_id");
  CREATE INDEX "site_settings_rels_path_idx" ON "laddex"."site_settings_rels" USING btree ("path");
  CREATE INDEX "site_settings_rels_pages_id_idx" ON "laddex"."site_settings_rels" USING btree ("pages_id");
  CREATE INDEX "site_settings_rels_products_id_idx" ON "laddex"."site_settings_rels" USING btree ("products_id");
  CREATE INDEX "site_settings_rels_category_id_idx" ON "laddex"."site_settings_rels" USING btree ("category_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "laddex"."products_gallery" CASCADE;
  DROP TABLE "laddex"."products_faqs" CASCADE;
  DROP TABLE "laddex"."products_laddex_details" CASCADE;
  DROP TABLE "laddex"."products_laddex_specs" CASCADE;
  DROP TABLE "laddex"."products_laddex_packaging_notes" CASCADE;
  DROP TABLE "laddex"."products_laddex_usage" CASCADE;
  DROP TABLE "laddex"."products" CASCADE;
  DROP TABLE "laddex"."products_rels" CASCADE;
  DROP TABLE "laddex"."_products_v_version_gallery" CASCADE;
  DROP TABLE "laddex"."_products_v_version_faqs" CASCADE;
  DROP TABLE "laddex"."_products_v_version_laddex_details" CASCADE;
  DROP TABLE "laddex"."_products_v_version_laddex_specs" CASCADE;
  DROP TABLE "laddex"."_products_v_version_laddex_packaging_notes" CASCADE;
  DROP TABLE "laddex"."_products_v_version_laddex_usage" CASCADE;
  DROP TABLE "laddex"."_products_v" CASCADE;
  DROP TABLE "laddex"."_products_v_rels" CASCADE;
  DROP TABLE "laddex"."orders_items" CASCADE;
  DROP TABLE "laddex"."orders" CASCADE;
  DROP TABLE "laddex"."carts_items" CASCADE;
  DROP TABLE "laddex"."carts" CASCADE;
  DROP TABLE "laddex"."pages_hero_links" CASCADE;
  DROP TABLE "laddex"."pages_blocks_cta_links" CASCADE;
  DROP TABLE "laddex"."pages_blocks_cta" CASCADE;
  DROP TABLE "laddex"."pages_blocks_archive" CASCADE;
  DROP TABLE "laddex"."pages_blocks_faq_faqs" CASCADE;
  DROP TABLE "laddex"."pages_blocks_faq" CASCADE;
  DROP TABLE "laddex"."pages_blocks_content_columns" CASCADE;
  DROP TABLE "laddex"."pages_blocks_content" CASCADE;
  DROP TABLE "laddex"."pages_blocks_gallery_images" CASCADE;
  DROP TABLE "laddex"."pages_blocks_gallery" CASCADE;
  DROP TABLE "laddex"."pages_blocks_html_embed" CASCADE;
  DROP TABLE "laddex"."pages" CASCADE;
  DROP TABLE "laddex"."pages_rels" CASCADE;
  DROP TABLE "laddex"."_pages_v_version_hero_links" CASCADE;
  DROP TABLE "laddex"."_pages_v_blocks_cta_links" CASCADE;
  DROP TABLE "laddex"."_pages_v_blocks_cta" CASCADE;
  DROP TABLE "laddex"."_pages_v_blocks_archive" CASCADE;
  DROP TABLE "laddex"."_pages_v_blocks_faq_faqs" CASCADE;
  DROP TABLE "laddex"."_pages_v_blocks_faq" CASCADE;
  DROP TABLE "laddex"."_pages_v_blocks_content_columns" CASCADE;
  DROP TABLE "laddex"."_pages_v_blocks_content" CASCADE;
  DROP TABLE "laddex"."_pages_v_blocks_gallery_images" CASCADE;
  DROP TABLE "laddex"."_pages_v_blocks_gallery" CASCADE;
  DROP TABLE "laddex"."_pages_v_blocks_html_embed" CASCADE;
  DROP TABLE "laddex"."_pages_v" CASCADE;
  DROP TABLE "laddex"."_pages_v_rels" CASCADE;
  DROP TABLE "laddex"."category_faqs" CASCADE;
  DROP TABLE "laddex"."category" CASCADE;
  DROP TABLE "laddex"."_category_v_version_faqs" CASCADE;
  DROP TABLE "laddex"."_category_v" CASCADE;
  DROP TABLE "laddex"."media" CASCADE;
  DROP TABLE "laddex"."seo_media" CASCADE;
  DROP TABLE "laddex"."gallery_media" CASCADE;
  DROP TABLE "laddex"."reviews" CASCADE;
  DROP TABLE "laddex"."variants_laddex_wholesale_tiers" CASCADE;
  DROP TABLE "laddex"."variants" CASCADE;
  DROP TABLE "laddex"."variants_rels" CASCADE;
  DROP TABLE "laddex"."_variants_v_version_laddex_wholesale_tiers" CASCADE;
  DROP TABLE "laddex"."_variants_v" CASCADE;
  DROP TABLE "laddex"."_variants_v_rels" CASCADE;
  DROP TABLE "laddex"."variant_types" CASCADE;
  DROP TABLE "laddex"."variant_options" CASCADE;
  DROP TABLE "laddex"."users_roles" CASCADE;
  DROP TABLE "laddex"."users_sessions" CASCADE;
  DROP TABLE "laddex"."users" CASCADE;
  DROP TABLE "laddex"."transactions_items" CASCADE;
  DROP TABLE "laddex"."transactions" CASCADE;
  DROP TABLE "laddex"."checkout_sessions_lines" CASCADE;
  DROP TABLE "laddex"."checkout_sessions" CASCADE;
  DROP TABLE "laddex"."delivery_zones_bands" CASCADE;
  DROP TABLE "laddex"."delivery_zones" CASCADE;
  DROP TABLE "laddex"."distribution_points" CASCADE;
  DROP TABLE "laddex"."wholesale_applications" CASCADE;
  DROP TABLE "laddex"."quote_requests_lines" CASCADE;
  DROP TABLE "laddex"."quote_requests" CASCADE;
  DROP TABLE "laddex"."addresses" CASCADE;
  DROP TABLE "laddex"."payload_kv" CASCADE;
  DROP TABLE "laddex"."payload_locked_documents" CASCADE;
  DROP TABLE "laddex"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "laddex"."payload_preferences" CASCADE;
  DROP TABLE "laddex"."payload_preferences_rels" CASCADE;
  DROP TABLE "laddex"."payload_migrations" CASCADE;
  DROP TABLE "laddex"."site_settings_header_nav_items" CASCADE;
  DROP TABLE "laddex"."site_settings_blocks_footer_nav_links" CASCADE;
  DROP TABLE "laddex"."site_settings_blocks_footer_nav" CASCADE;
  DROP TABLE "laddex"."site_settings_blocks_content_columns" CASCADE;
  DROP TABLE "laddex"."site_settings_blocks_content" CASCADE;
  DROP TABLE "laddex"."site_settings_blocks_footer_icons_items" CASCADE;
  DROP TABLE "laddex"."site_settings_blocks_footer_icons" CASCADE;
  DROP TABLE "laddex"."site_settings" CASCADE;
  DROP TABLE "laddex"."site_settings_rels" CASCADE;
  DROP TYPE "laddex"."enum_products_laddex_category";
  DROP TYPE "laddex"."enum_products_laddex_base_unit";
  DROP TYPE "laddex"."enum_products_status";
  DROP TYPE "laddex"."enum__products_v_version_laddex_category";
  DROP TYPE "laddex"."enum__products_v_version_laddex_base_unit";
  DROP TYPE "laddex"."enum__products_v_version_status";
  DROP TYPE "laddex"."enum_orders_status";
  DROP TYPE "laddex"."enum_orders_laddex_fulfilment";
  DROP TYPE "laddex"."enum_orders_laddex_channel";
  DROP TYPE "laddex"."enum_orders_laddex_fee_basis";
  DROP TYPE "laddex"."enum_carts_currency";
  DROP TYPE "laddex"."enum_pages_hero_links_link_type";
  DROP TYPE "laddex"."enum_pages_hero_links_link_appearance";
  DROP TYPE "laddex"."enum_pages_blocks_cta_links_link_type";
  DROP TYPE "laddex"."enum_pages_blocks_cta_links_link_appearance";
  DROP TYPE "laddex"."enum_pages_blocks_archive_intro_alignment";
  DROP TYPE "laddex"."enum_pages_blocks_archive_content_type";
  DROP TYPE "laddex"."enum_pages_blocks_archive_display_mode";
  DROP TYPE "laddex"."enum_pages_blocks_archive_populate_by";
  DROP TYPE "laddex"."enum_pages_blocks_content_columns_size";
  DROP TYPE "laddex"."enum_pages_blocks_content_columns_link_type";
  DROP TYPE "laddex"."enum_pages_hero_type";
  DROP TYPE "laddex"."enum_pages_status";
  DROP TYPE "laddex"."enum__pages_v_version_hero_links_link_type";
  DROP TYPE "laddex"."enum__pages_v_version_hero_links_link_appearance";
  DROP TYPE "laddex"."enum__pages_v_blocks_cta_links_link_type";
  DROP TYPE "laddex"."enum__pages_v_blocks_cta_links_link_appearance";
  DROP TYPE "laddex"."enum__pages_v_blocks_archive_intro_alignment";
  DROP TYPE "laddex"."enum__pages_v_blocks_archive_content_type";
  DROP TYPE "laddex"."enum__pages_v_blocks_archive_display_mode";
  DROP TYPE "laddex"."enum__pages_v_blocks_archive_populate_by";
  DROP TYPE "laddex"."enum__pages_v_blocks_content_columns_size";
  DROP TYPE "laddex"."enum__pages_v_blocks_content_columns_link_type";
  DROP TYPE "laddex"."enum__pages_v_version_hero_type";
  DROP TYPE "laddex"."enum__pages_v_version_status";
  DROP TYPE "laddex"."enum_category_status";
  DROP TYPE "laddex"."enum__category_v_version_status";
  DROP TYPE "laddex"."enum_variants_laddex_size_unit";
  DROP TYPE "laddex"."enum_variants_laddex_packaging";
  DROP TYPE "laddex"."enum_variants_laddex_format";
  DROP TYPE "laddex"."enum_variants_status";
  DROP TYPE "laddex"."enum__variants_v_version_laddex_size_unit";
  DROP TYPE "laddex"."enum__variants_v_version_laddex_packaging";
  DROP TYPE "laddex"."enum__variants_v_version_laddex_format";
  DROP TYPE "laddex"."enum__variants_v_version_status";
  DROP TYPE "laddex"."enum_variant_types_selector_style";
  DROP TYPE "laddex"."enum_users_roles";
  DROP TYPE "laddex"."enum_users_wholesale_status";
  DROP TYPE "laddex"."enum_transactions_status";
  DROP TYPE "laddex"."enum_transactions_currency";
  DROP TYPE "laddex"."enum_checkout_sessions_fulfilment";
  DROP TYPE "laddex"."enum_checkout_sessions_fee_basis";
  DROP TYPE "laddex"."enum_checkout_sessions_currency";
  DROP TYPE "laddex"."enum_checkout_sessions_status";
  DROP TYPE "laddex"."enum_delivery_zones_region_id";
  DROP TYPE "laddex"."enum_wholesale_applications_business_type";
  DROP TYPE "laddex"."enum_wholesale_applications_status";
  DROP TYPE "laddex"."enum_quote_requests_status";
  DROP TYPE "laddex"."enum_addresses_country";
  DROP TYPE "laddex"."enum_site_settings_header_nav_items_link_type";
  DROP TYPE "laddex"."enum_site_settings_blocks_footer_nav_links_link_type";
  DROP TYPE "laddex"."enum_site_settings_blocks_content_columns_size";
  DROP TYPE "laddex"."enum_site_settings_blocks_content_columns_link_type";
  DROP TYPE "laddex"."enum_site_settings_blocks_footer_icons_items_icon";
  DROP TYPE "laddex"."enum_site_settings_blocks_footer_icons_items_link_type";`)
}
