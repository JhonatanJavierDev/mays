const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const https = require("https");

const app = express();
const PORT = 3000;

function getDirectoryUrl(code) {
  return `https://publitas.mayszl.com/${code}/`;
}

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

app.use(express.static("public"));

app.get("/images", async (req, res) => {
  const code = req.query.code || "";
  const DIRECTORY_URL = getDirectoryUrl(code);

  try {
    const response = await axiosInstance.get(DIRECTORY_URL);
    const $ = cheerio.load(response.data);

    let images = [];
    $("a").each((index, element) => {
      const href = $(element).attr("href");
      if (href && href.endsWith(".jpg")) {
        images.push({
          filename: path.basename(href),
          url: href.startsWith("http") ? href : path.join(DIRECTORY_URL, href),
        });
      }
    });

    if (images.length === 0) {
      throw new Error("No images found.");
    }

    res.json(images);
  } catch (error) {
    console.error("Error fetching images:", error.message);
    res.status(500).json({ message: "Error fetching images" });
  }
});

// Endpoint to download an image
app.get("/download", async (req, res) => {
  const imageUrl = req.query.url;
  if (imageUrl) {
    try {
      const response = await axiosInstance.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const fileName = path.basename(imageUrl);
      res.set("Content-Disposition", `attachment; filename=${fileName}`);
      res.set("Content-Type", response.headers["content-type"]);
      res.send(response.data);
    } catch (error) {
      console.error("Error downloading image:", error.message);
      res.status(500).json({ message: "Error downloading image" });
    }
  } else {
    res.status(400).json({ message: "Image URL is missing" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
