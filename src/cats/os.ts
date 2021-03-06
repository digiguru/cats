//
// Copyright (c) JBaron.  All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

/**
 * This module abstracts out the native File IO and Process access. Right now it uses Nodejs, but this
 * could be changed to another implementation like a cloud storage API.
 * 
 * @TODO make this more an async api so it becomes easier to switch to other implementations
 * Perhaps after TS has implement await type of functionality.
 */
module OS.File {

        window["EventEmitter"] = require("events").EventEmitter;
        var FS=require("fs");
        var exec = require("child_process").exec;
        var glob = require("glob");

        /**
         * Very lightweight watcher for files and directories
         */ 
        export class Watcher extends EventEmitter {
            
            private watches = {};
            
            constructor() {
                super();
            }
            
            add(name:string) {
                if (this.watches[name]) return;
                var w = FS.watch(name, (event,filename) => {
                    console.info("Node changed " + name + " event " + event + " fileName " + filename);
                    this.emit("change", name, event, filename);
                });
                this.watches[name] = w;
            }
            
            addDir(name:string) {
                if (this.watches[name]) return;
                var w = FS.watch(name, (event,filename) => {
                    console.info("Node changed " + name + " event " + event + " fileName " + filename);
                    if (event === "rename") this.emit("change", name, event, filename);
                });
                this.watches[name] = w;
            }
            
            remove(name:string) {
                var w = this.watches[name];
                if (w) w.close();
            }
            
            
        }


        
 
        
        /**
         * Create recursively directories if they don't exist yet
         * @param path The directory path to create
         */ 
        export function mkdirRecursiveSync(path: string) {
            if (!FS.existsSync(path)) {
                mkdirRecursiveSync(PATH.dirname(path));
                FS.mkdirSync(path,509); //, 0775);
            }
        }

        /**
         * Create a file watcher
         */ 
        export function getWatcher() {
            var watcher = new Watcher();
            return watcher;
        }

       
        /**
         * Run an external command like a build tool
         * 
         */ 
        export function runCommand(cmd:string, options:any, logger=IDE.console) {
        
            if (! options.env) {
                    options.env = process.env;
            }
            
            var child = exec(cmd, options, () => {
                /* ignore the buffers */
            });
            var id = child.pid;
            IDE.processTable.addProcess(child, cmd);
           
            child.stdout.on("data", function (data) {
              logger.log("" + data);
            });
            
            child.stderr.on("data", function (data) {
              logger.error("" + data);
            });
            
            child.on("close", function (code) {
              logger.log("Done");
            });
        }
       
        /**
         * Remove a file or an empty directory
         * @param path the path of the file or directory
         */ 
        export function remove(path:string) {
            var isFile = FS.statSync(path).isFile();
            if (isFile) 
                FS.unlinkSync(path);
            else 
                FS.rmdirSync(path);
        }

        export function isOSX() {
            return process.platform === "darwin";
        }

        export function isWindows() {
            return process.platform === "win32";
        }

        export function join(a,b) : string{
            var result = PATH.join(a,b);
            return switchToForwardSlashes(result);
            
        }

        export function find(pattern:string, rootDir:string, cb:Function) {
            var files:Array<string> = glob.sync(pattern, {cwd:rootDir, mark:true}) ;
            files = files.filter((name) => {return name.slice(-1) !== "/"; });
            cb(null,files);
        }


        /**
         * Rename a file or directory
         * 
         * @param oldName the old name of the file or directory
         * @param newName the new name of the file or directory
         */ 
        export function rename(oldName:string,newName: string) {
             FS.renameSync(oldName, newName);
        }


        /**
         * Determine the newLineMode.
         * 
         * @return Return value is either dos or unix
         */ 
        function determineNewLIneMode(): string {
            var mode = IDE.project.config.codingStandards.newLineMode;
            if ((mode === "dos") || (mode ==="unix")) return mode;
         
            if (isWindows()) return "dos";
            return "unix";
        }

        /**
         * Write text content to a file. If a directory doesn't exist, create it
         * @param name The full name of the file
         * @param value The content of the file
         */ 
         export function writeTextFile(name: string, value: string, stat=false):any {
            var newLineMode = determineNewLIneMode();
            if (newLineMode === "dos") {
                value = value.replace(/\n/g, "\r\n");
            }
            mkdirRecursiveSync(PATH.dirname(name));
            FS.writeFileSync(name, value, "utf8");
            
            if (stat) return FS.statSync(name);
            return null;
        }
        
        export function switchToForwardSlashes(path:string):string {
            if (! path) return path;
            return path.replace(/\\/g, "/");
        }
         
        /**
         * Sort two directory directorie entries first on 
         * directory versus file and then on alphabet.
         * 
         */ 
        function sort(a: Cats.FileEntry, b: Cats.FileEntry) {
            if ((!a.isDirectory) && b.isDirectory) return 1;
            if (a.isDirectory && (!b.isDirectory)) return -1;
            if (a.name > b.name) return 1;
            if (b.name > a.name) return -1;
            return 0;
        }
 
                
        /**
         * Read the files from a directory
         * @param directory The directory name that should be read
         */ 
        export function readDir(directory:string, sorted=false): Cats.FileEntry[] {
            var files:string[] = FS.readdirSync(directory);
            var result = [];
            files.forEach((file) => {
                var fullName = OS.File.join(directory, file);
                var stats = FS.statSync(fullName);
                result.push({
                   name:file,
                   fullName: fullName,
                   isFile: stats.isFile() ,
                   isDirectory: stats.isDirectory()
                });
            });
            if (sorted) result.sort(sort);
            return result;
        }
        
      
        /**
         * Read the content from a text file
         * @param name The full name/path of the file
         */ 
        export function readTextFile(name: string): string {
            if (name == null ) return "";

            var data = FS.readFileSync(name, "utf8");

            // Use single character line returns
            data = data.replace(/\r\n?/g, "\n");

            // Remove the BOM (only MS uses BOM for UTF8)
            data = data.replace(/^\uFEFF/, '');
            return data;
        } 
                   
      
}

