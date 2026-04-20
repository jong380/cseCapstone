CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    time TIMESTAMP NOT NULL,
    content TEXT NOT NULL,
    source VARCHAR(255) NOT NULL,
    sender VARCHAR(255) NOT NULL
);