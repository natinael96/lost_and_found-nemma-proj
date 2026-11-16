import { app } from "./app.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.listen(PORT, () => {
  console.log(`Lost & Found Matcher API listening on http://localhost:${PORT}`);
});
