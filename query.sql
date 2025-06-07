--membuat database dan menggunakannya
CREATE DATABASE db_barang;
Use db_barang;

-- Tabel kategori
CREATE TABLE kategori (
    id_kategori INT PRIMARY KEY AUTO_INCREMENT,
    nama_kategori VARCHAR(100) NOT NULL
);

-- Tabel produk
CREATE TABLE produk (
    id_produk INT PRIMARY KEY AUTO_INCREMENT,
    nama_produk VARCHAR(100) NOT NULL,
    harga DECIMAL(10, 2) NOT NULL,
    id_kategori INT NOT NULL,
    FOREIGN KEY (id_kategori) REFERENCES kategori(id_kategori)
);

-- Tabel stok
CREATE TABLE stok (
    id_stok INT PRIMARY KEY AUTO_INCREMENT,
    id_produk INT NOT NULL UNIQUE,
    jumlah_stok INT NOT NULL,
    FOREIGN KEY (id_produk) REFERENCES produk(id_produk)
);

-- Tabel user untuk login
CREATE TABLE user (
  id_user INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL
);

--isi dari kategori
INSERT INTO kategori (nama_kategori)
VALUES ('Makanan'), ('Minuman'), ('Alat Tulis');

--username dan password admin
INSERT INTO user (username, password) VALUES
  ('admin', 'admin123');