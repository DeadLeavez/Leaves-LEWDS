"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const VFS_1 = require("./src/VFS");
function copyDir(filepath, target, fileExtensions) {
    const files = this.getFiles(filepath);
    const dirs = this.getDirs(filepath);
    if (!this.exists(target)) {
        this.createDir(`${target}/`);
    }
    for (const dir of dirs) {
        this.copyDir(path_1.default.join(filepath, dir), path_1.default.join(target, dir), fileExtensions);
    }
    for (const file of files) {
        // copy all if fileExtension is not set, copy only those with fileExtension if set
        if (!fileExtensions || fileExtensions.includes(file.split(".").pop() ?? "")) {
            this.copyFile(path_1.default.join(filepath, file), path_1.default.join(target, file));
        }
    }
}
async function main() {
    let vfs = new VFS_1.VFS();
    const currentDir = path_1.default.dirname(__filename);
    vfs.copyDir(currentDir + "/../deps/", currentDir + "/src/deps/");
}
main();
