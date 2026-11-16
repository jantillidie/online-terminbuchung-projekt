set names utf8mb4;

DROP DATABASE IF EXISTS schnittpunkt;
CREATE DATABASE schnittpunkt CHARACTER SET utf8mb4;
USE schnittpunkt;

create table kunde (
    id int auto_increment primary key,
    name varchar(100) not null,
    telefon varchar(30) not null,
    email varchar(255) not null unique
);

create table mitarbeiter (
    id int auto_increment primary key,
    name varchar(100) not null unique,
    aktiv boolean not null default true
);

create table leistung (
    id int auto_increment primary key,
    name varchar(100) not null unique,
    dauer_min smallint unsigned not null,
    preis decimal(6,2) not null,
    aktiv boolean not null default true,
    check (dauer_min > 0),
    check (preis >= 0)
);

create table mitarbeiter_leistung (
    mitarbeiter_id int not null,
    leistung_id int not null,
    primary key (mitarbeiter_id, leistung_id),
    foreign key (mitarbeiter_id) references mitarbeiter(id),
    foreign key (leistung_id) references leistung(id)
);

create table termin (
    id int auto_increment primary key,
    kunde_id int not null,
    mitarbeiter_id int not null,
    leistung_id int not null,
    beginn datetime not null,
    ende datetime not null,
    preis decimal(6,2) not null,
    status enum('gebucht','erledigt','storniert') not null default 'gebucht',
    storno_code char(36) not null unique,
    erstellt_am datetime not null default current_timestamp,
    foreign key (kunde_id) references kunde(id),
    foreign key (mitarbeiter_id) references mitarbeiter(id),
    foreign key (leistung_id) references leistung(id),
    check (ende > beginn),
    index idx_termin_ma_beginn (mitarbeiter_id, beginn)
);


insert into mitarbeiter (id, name) values
(1, 'Sabine Kowalski'),
(2, 'Mara'),
(3, 'Jonas');

insert into leistung (id, name, dauer_min, preis) values
(1, 'Herrenschnitt', 30, 28.00),
(2, 'Damenschnitt', 45, 42.00),
(3, 'Waschen und Föhnen', 30, 22.00),
(4, 'Kinderschnitt', 20, 16.00),
(5, 'Bartpflege', 15, 12.00),
(6, 'Färben', 90, 75.00);

insert into mitarbeiter_leistung (mitarbeiter_id, leistung_id) values
(1,1),
(1,2),
(1,3),
(1,4),
(1,5),
(1,6),
(2,1),
(2,2),
(2,3),
(2,4),
(2,5),
(2,6),
(3,1),
(3,3),
(3,4),
(3,5);
