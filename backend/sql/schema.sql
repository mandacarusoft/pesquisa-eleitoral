-- Schema MySQL do Sistema de Pesquisa Eleitoral (tabelas e colunas em portugues)
-- Execute com: mysql -u root -p < sql/schema.sql

CREATE DATABASE IF NOT EXISTS pesquisa_eleitoral
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pesquisa_eleitoral;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  papel ENUM('admin','pesquisador') NOT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pesquisas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  cidade VARCHAR(150),
  situacao ENUM('ativa','encerrada') NOT NULL DEFAULT 'ativa',
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS perguntas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pesquisa_id INT NOT NULL,
  texto TEXT NOT NULL,
  tipo ENUM('unica_escolha','multipla_escolha','texto_livre','demografica') NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  obrigatoria TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (pesquisa_id) REFERENCES pesquisas(id) ON DELETE CASCADE,
  INDEX idx_perguntas_pesquisa (pesquisa_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alternativas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pergunta_id INT NOT NULL,
  texto VARCHAR(255) NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE,
  INDEX idx_alternativas_pergunta (pergunta_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessoes (
  id VARCHAR(36) PRIMARY KEY,
  pesquisa_id INT NOT NULL,
  pesquisador_id INT NOT NULL,
  bairro VARCHAR(150),
  zona ENUM('Urbana','Rural'),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pesquisa_id) REFERENCES pesquisas(id) ON DELETE CASCADE,
  FOREIGN KEY (pesquisador_id) REFERENCES usuarios(id),
  INDEX idx_sessoes_pesquisa (pesquisa_id),
  INDEX idx_sessoes_pesquisador (pesquisador_id),
  INDEX idx_sessoes_bairro (bairro)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS respostas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sessao_id VARCHAR(36) NOT NULL,
  pergunta_id INT NOT NULL,
  alternativa_id INT NULL,
  resposta_texto TEXT NULL,
  FOREIGN KEY (sessao_id) REFERENCES sessoes(id) ON DELETE CASCADE,
  FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE,
  FOREIGN KEY (alternativa_id) REFERENCES alternativas(id) ON DELETE SET NULL,
  INDEX idx_respostas_sessao (sessao_id),
  INDEX idx_respostas_pergunta (pergunta_id)
) ENGINE=InnoDB;
