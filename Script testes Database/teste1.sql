-- Limpar os dados das tabelas antes dos testes (Opcional)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE utilizador_ambiente_perfil;
TRUNCATE TABLE utilizador;
TRUNCATE TABLE ambiente;
TRUNCATE TABLE tipo_ambiente;
TRUNCATE TABLE perfil;
TRUNCATE TABLE hierarquia;
TRUNCATE TABLE hierarquia_perfil;
TRUNCATE TABLE assocutilizadorambiente;
TRUNCATE TABLE dono_ambiente;
TRUNCATE TABLE cartao_preferencias;
TRUNCATE TABLE tipo_preferencia;
TRUNCATE TABLE simulacao;
TRUNCATE TABLE simulacao_valores;
SET FOREIGN_KEY_CHECKS = 1;

-- Inserir Tipos de Ambiente
INSERT INTO tipo_ambiente (nome) VALUES ('Doméstico'), ('Lazer'), ('Profissional');

-- Inserir Ambientes
INSERT INTO ambiente (id_ambiente, nome, id_tipo) VALUES (1, 'Casa do João', 1), (2, 'Escritório da Empresa X', 3);

-- Inserir Utilizadores
INSERT INTO utilizador (nome, email) VALUES ('João Silva', 'joao@email.com'), ('Maria Santos', 'maria@email.com');

-- Associar Utilizadores a Ambientes
INSERT INTO assocutilizadorambiente (id_utilizador, id_ambiente) VALUES (1, 1), (2, 2);

-- Criar Perfis
INSERT INTO perfil (id_perfil, nome, hierarquial_percentagem) VALUES (1, 'Dono', 50), (2, 'Gerente', 80);

-- Criar Hierarquia e associá-la ao Ambiente
INSERT INTO hierarquia (nome, id_ambiente) VALUES ('Hierarquia Casa', 1) , ('Hierarquia Escritório', 2);

-- Associar Perfis à Hierarquia
INSERT INTO hierarquia_perfil (id_hierarquia, id_perfil, id_ambiente, hierarquia_percentagem) 
VALUES (1, 1, 2, 50), (2, 2, 2, 80);

-- Associar Utilizadores a Perfis dentro de Ambientes
INSERT INTO utilizador_ambiente_perfil (id_utilizador, id_ambiente, id_perfil) VALUES (1, 1, 1), (2, 2, 2);

-- Criar Preferências
INSERT INTO tipo_preferencia (nome, unidades_preferencia, valor_maximo, valor_minimo) 
VALUES ('Temperatura', '°C', 30, 10), ('Luminosidade', 'Lux', 1000, 100);

-- Definir Preferências dos Utilizadores
INSERT INTO cartao_preferencias (id_utilizador, id_tipo_preferencia, valor) VALUES (1, 1, 22), (2, 2, 500);

-- Criar uma Simulação para um Ambiente
INSERT INTO simulacao (id_ambiente) VALUES (1) , (2);

-- Adicionar Valores Simulados
INSERT INTO simulacao_valores (id_simulacao, id_tipo_preferencia, valor_calculado) VALUES (1, 1, 22.5), (2, 2, 300);

-- CONSULTAS PARA TESTAR A BASE DE DADOS

-- Verificar Ambientes e Tipos
SELECT a.nome AS Ambiente, t.nome AS Tipo 
FROM ambiente a
JOIN tipo_ambiente t ON a.id_tipo = t.id_tipo;

-- Verificar Utilizadores e Ambientes
SELECT u.nome AS Utilizador, a.nome AS Ambiente 
FROM assocutilizadorambiente au
JOIN utilizador u ON au.id_utilizador = u.id_utilizador
JOIN ambiente a ON au.id_ambiente = a.id_ambiente;

-- Verificar Perfis e Hierarquia
SELECT h.nome AS Hierarquia, p.nome AS Perfil, hp.hierarquia_percentagem AS Percentagem
FROM hierarquia_perfil hp
JOIN perfil p ON hp.id_perfil = p.id_perfil
JOIN hierarquia h ON hp.id_hierarquia = h.id_hierarquia;

-- Verificar Utilizadores, Perfis e Ambientes
SELECT u.nome AS Utilizador, a.nome AS Ambiente, p.nome AS Perfil
FROM utilizador_ambiente_perfil uap
JOIN utilizador u ON uap.id_utilizador = u.id_utilizador
JOIN ambiente a ON uap.id_ambiente = a.id_ambiente
JOIN perfil p ON uap.id_perfil = p.id_perfil;

-- Verificar Resultados da Simulação
SELECT s.id_simulacao, a.nome AS Ambiente, tp.nome AS Preferencia, sv.valor_calculado
FROM simulacao_valores sv
JOIN simulacao s ON sv.id_simulacao = s.id_simulacao
JOIN ambiente a ON s.id_ambiente = a.id_ambiente
JOIN tipo_preferencia tp ON sv.id_tipo_preferencia = tp.id_tipo_preferencia;
