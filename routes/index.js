const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database/demo.db");
const express = require("express");
const router = express.Router();
const posts = require("../posts.json");

const Model = [
  "id INTEGER NOT NULL UNIQUE",
  "title TEXT NOT NULL",
  "body TEXT NOT NULL",
  "category TEXT NOT NULL",
  "user INTEGER NOT NULL",
  "likes INTEGER NULL",
  "tags TEXT NULL",
  "created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
  "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP",
  "PRIMARY KEY(id AUTOINCREMENT)",
];

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS posts (${Model.join(",")})`);

  // ** Select All Posts
  router.get("", async (req, res) => {
    const skip = parseInt(req.query.skip || "0");
    const limit = parseInt(req.query.limit || "12");
    const sort = req.query.sort || "id";
    try {
      db.each("SELECT COUNT(id) AS total FROM posts", (err, { total }) => {
        if (err) return console.log(err);
        db.all(
          `SELECT * FROM posts  ORDER BY ${sort}  LIMIT ${limit} OFFSET ${skip}`,
          (err, items) => {
            if (err) throw err;
            res.json({ items, limit, skip, total });
          }
        );
      });
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  });

  // ** Select Single Post
  router.get("/:id", async (req, res) => {
    try {
      const $sql = `SELECT * FROM posts WHERE id=${req.params.id}`;
      db.get($sql, (err, item) => {
        if (err) throw err;
        res.json(item || null);
      });
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  });

  // Create single post
  router.post("", async (req, res) => {
    try {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body).map((el) => JSON.stringify(el));
      const $sql = `INSERT INTO posts (${keys}) VALUES (${values})`;
      db.run($sql, function (err) {
        if (err) return console.log(err);
        res.json(this.lastID);
      });
    } catch (error) {
      console.error(err);
      res.status(500).json(err);
    }
  });

  // Add multiple posts
  router.post("/many", async (req, res) => {
    try {
      const $sql = posts.map((body) => {
        const keys = Object.keys(body);
        const values = Object.values(body).map((el) => JSON.stringify(el));
        return `INSERT INTO posts (${keys}) VALUES (${values})`;
      });

      $sql.forEach((sql, index) => {
        db.run(sql, function (err) {
          if (err) return console.log(err);
          console.log(this.lastID);
          if (index == $sql.length - 1) res.json(`${$sql.length} posts added!`);
        });
      });
    } catch (error) {
      console.error(err);
      res.status(500).json(err);
    }
  });

  // Update Post
  router.patch("/:id", async (req, res) => {
    try {
      const query = Object.entries(req.body)
        .map(([key, val]) => {
          return `${key}=${JSON.stringify(val)}`;
        })
        .join(";");
      const $sql = `UPDATE posts SET ${query} WHERE id=${req.params.id}`;
      db.run($sql, function (err) {
        if (err) return console.log(err);
        console.log(this.changes, "posts updated");
        res.json(`Post updated!`);
      });
    } catch (error) {
      console.error(err);
      res.status(500).json(err);
    }
  });

  // Delete Post
  router.delete("/:id", async (req, res) => {
    try {
      const $sql = `DELETE FROM posts WHERE id=${req.params.id}`;
      db.run($sql, function (err) {
        if (err) return console.log(err);
        console.log(this.changes, "posts deleted");
        res.json(`Post deleted!`);
      });
    } catch (error) {
      console.error(err);
      res.status(500).json(err);
    }
  });
});

// db.close();
module.exports = router;
