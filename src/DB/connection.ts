import { connect } from "mongoose";
import { DB_URI_LOCAL } from "../config/config.service.js";

async function testDBConnection() {
  try {
    await connect(DB_URI_LOCAL);
    console.log("DB connected successfully.");
  } catch (err) {
    console.log("DB connection failed.");
  }
}

export default testDBConnection;
