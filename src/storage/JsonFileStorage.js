const fs = require('fs');
const path = require('path');

class JsonFileStorage {
  constructor(filePath) {
    this.filePath = filePath;
  }

  readAll(fallback = []) {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(`Error reading ${this.filePath}:`, e.message);
    }
    return fallback;
  }

  writeAll(data) {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error(`Error writing to ${this.filePath}:`, e.message);
      return false;
    }
  }
}

module.exports = JsonFileStorage;
