import ConduitGrpcSdk from "@conduit/grpc-sdk";
import fs from "fs";
import * as path from 'path';
import AuthenticationModule from './Authentication';

let paths = require("./admin/admin.json")

// if (process.env.CONDUIT_SERVER) {
let grpcSdk = new ConduitGrpcSdk("0.0.0.0:55152");
let store = new AuthenticationModule(grpcSdk);
grpcSdk.config.registerModule('authentication', store.url).catch(err => {
  console.error(err)
  process.exit(-1);
});
let protofile = fs.readFileSync(path.resolve(__dirname, './admin/admin.proto'))
grpcSdk.admin.register(paths.functions, protofile.toString('UTF-8'),store.url).catch((err: Error) => {
  console.log("Failed to register admin routes for authentication module!")
  console.error(err);
});
// } else {
//     throw new Error("Conduit server URL not provided");
// }
