-- Opcional: cria um usuario MySQL dedicado a aplicacao (recomendado em vez de usar root)
-- Ajuste a senha antes de rodar e replique o mesmo valor em DB_PASSWORD no .env

CREATE USER IF NOT EXISTS 'pesquisa_user'@'localhost' IDENTIFIED BY 'troque-esta-senha';
GRANT ALL PRIVILEGES ON pesquisa_eleitoral.* TO 'pesquisa_user'@'localhost';
FLUSH PRIVILEGES;
