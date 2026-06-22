CREATE TABLE brands (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,

  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO brands (name, slug, description ,is_active) VALUES ('Khaadi', 'khaadi' , 'Khaadi brand', 1);
INSERT INTO brands (name, slug, description ,is_active) VALUES ('MARIA B', 'maria-b' , 'MARIA B brand', 1);

CREATE TABLE product_groups (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  brand_id BIGINT UNSIGNED NOT NULL,

  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_pg_brand
    FOREIGN KEY (brand_id)
    REFERENCES brands(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  product_group_id BIGINT UNSIGNED NOT NULL,

  sku VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,

  stitch_type VARCHAR(50) NULL,
  design_type VARCHAR(100) NULL,
  fabric VARCHAR(100) NULL,
  pieces VARCHAR(50) NULL,
  garment_type VARCHAR(50) NULL,

  price DECIMAL(10,2) NULL,
  discount_price DECIMAL(10,2) NULL,
  source_url VARCHAR(300) NULL,

  in_stock BOOLEAN DEFAULT TRUE,
  description TEXT NULL,

  is_new BOOLEAN DEFAULT FALSE,
  trending_score FLOAT DEFAULT 0,

  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_products_group
    FOREIGN KEY (product_group_id)
    REFERENCES product_groups(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  url VARCHAR(1000) NOT NULL,

  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE image_product (
  image_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,

  PRIMARY KEY (image_id, product_id),

  CONSTRAINT fk_ip_image
    FOREIGN KEY (image_id)
    REFERENCES images(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_ip_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;


CREATE TABLE seasons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE product_group_season (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_group_id BIGINT UNSIGNED NOT NULL,
  season_id BIGINT UNSIGNED NOT NULL,

  UNIQUE KEY uq_group_season (product_group_id, season_id),

  CONSTRAINT fk_pgs_group
    FOREIGN KEY (product_group_id)
    REFERENCES product_groups(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_pgs_season
    FOREIGN KEY (season_id)
    REFERENCES seasons(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;


CREATE TABLE product_group_category (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_group_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,

  UNIQUE KEY uq_group_category (product_group_id, category_id),

  CONSTRAINT fk_pgc_group
    FOREIGN KEY (product_group_id)
    REFERENCES product_groups(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_pgc_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE occasions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE product_group_occasion (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_group_id BIGINT UNSIGNED NOT NULL,
  occasion_id BIGINT UNSIGNED NOT NULL,

  UNIQUE KEY uq_group_occasion (product_group_id, occasion_id),

  CONSTRAINT fk_pgo_group
    FOREIGN KEY (product_group_id)
    REFERENCES product_groups(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_pgo_occasion
    FOREIGN KEY (occasion_id)
    REFERENCES occasions(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_products_group ON products(product_group_id);
CREATE INDEX idx_pgs_season ON product_group_season(season_id);
CREATE INDEX idx_pgc_category ON product_group_category(category_id);
CREATE INDEX idx_pgo_occasion ON product_group_occasion(occasion_id);