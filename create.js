var touch = require("touch");
var fs = require('fs');
var configs = require('./generationConfigs');
var patternFolder = configs.patternsFolder;

var path = configs.devFilesPath;
var moduleName = process.argv.slice(-1)[0];
var parents = process.argv.slice(2, -1);

var parentsPath = parents.length && parents.reduce(function (item1, item2) {
        return item1 + "/components/" + item2;
    });

if (!parentsPath) parentsPath = "";
else if (parentsPath !== "commons") parentsPath = (parentsPath + "/components") || "";


String.prototype.withClosingSlash = function () {
    return this.length ? this + "/" : "";
};
String.prototype.withOpeningSlash = function () {
    return this.length ? "/" + this : "";
};
String.prototype.withSlashes = function () {
    return this.withOpeningSlash().withClosingSlash();
};


console.log("parents ", parents);
console.log("module ", moduleName);
console.log("parentPath ", parentsPath);
var fullPath, depth = getDepth();

create();

function create() {
    //create folder for generated module and files
    var pathToComponentFolder = path + "/" + parentsPath.withClosingSlash();
    if (!fs.existsSync(pathToComponentFolder)) {
        fs.mkdirSync(pathToComponentFolder);
    }
    fullPath = path + "/" + parentsPath.withClosingSlash() + moduleName;
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
    fs.mkdirSync(fullPath);

    //create files in a folder
    createFiles();
}

function createFiles() {
    var path = configs.devFilesPath + "/" + parentsPath.withClosingSlash() + moduleName;
    var modulePath = path + "/" + moduleName;
    console.log("\nin " + path);
    generateFiles(modulePath);
}

function getDepth(){
    var depthLevel = (parentsPath && parentsPath.split("/").length) || 0;
    var dots = "";
    for (var i = 0; i < depthLevel; i++) {
        dots += "../"
    }
    return dots;
}

function generateFiles(modulePath) {
    var data, suffix;
    data = fs.readFileSync(patternFolder + '/component').toString();
    createFile(modulePath, "component", data, 'ts');
    data = fs.readFileSync(patternFolder + '/view').toString();
    createFile(modulePath, "", data, 'html');
    generatePreprocessorCss(modulePath, suffix, data);
    getParentComponent();
}

function createFile(_modulePath, _suffix, _data, _fileType) {
    _data = _data
        .replace(/--name--/g, moduleName)
        .replace(/--parents-path--\//g, (parentsPath.withClosingSlash()))
        .replace(/--namespace--/g, configs.namespace)
        .replace(/--Name--/g, capitalize(moduleName))
        .replace(/--name-dashed--/g, camelCaseToHypen(moduleName));
    var suffix = _suffix ? "." + _suffix : "";
    var fileName = _modulePath + (suffix || "") + "." + _fileType;
    touch(fileName);
    console.log("fileName:\n", fileName);
    fs.writeFile(fileName, _data, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

function generatePreprocessorCss(_modulePath, _suffix, _data) {
    _data = fs.readFileSync(patternFolder + '/scss').toString();
    _data = _data
        .replace('--index-scss-path--', "../../" + depth + configs.mainStyleFilePath)
        .replace(/--name-dashed--/g, camelCaseToHypen(moduleName))
        .replace(/--full-module-path--/g, fullPath.replace("src/", ""));
    var fileName = _modulePath + ".scss";
    touch(fileName);
    console.log("fileName:\n", fileName);
    fs.writeFile(fileName, _data, 'utf8', function (err) {
        if (err) return console.log(err);
    });

    console.log("--------------> " + moduleName + "." + configs.preprocessorCss);
}


function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}

function camelCaseToHypen(str) {
    return str.replace(/([A-Z])/g, function ($1) {
        return "-" + $1.toLowerCase();
    });
}

function getParentComponent() {
    var length = parents.length;
    var parentParents = Object.assign([], parents);
    if (length && parentsPath !== "commons") {
        var parent = parents.reverse().find(function (parent) {
            if (parent !== 'components') return true;
            else parentParents.pop();
        });


        var parentParentsPath = parentParents.length && parentParents.reduce(function (item1, item2) {
                return item1 + "/components/" + item2;
            });
        parentParentsPath = parentParentsPath || "";

        var parentFullPath = path + "/" + parentParentsPath;
        var parentFilePath = parentFullPath + "/" + parent + ".component.ts";

        var _parentData = fs.readFileSync(parentFilePath).toString();

        var _parentDataSplitted = _parentData.split("directives");
        _parentDataSplitted[1] = _parentDataSplitted[1].replace("]", "," + capitalize(moduleName) + "Component]").replace("[,", "[")
        _parentData = _parentDataSplitted.join("directives");
        var importPath = "import {" + capitalize(moduleName) + "Component" + "} from './" + "components/" + moduleName + "/" + moduleName + ".component" + "';"
        _parentData = importPath + "\n" + _parentData;

        fs.writeFile(parentFilePath, _parentData, 'utf8', function (err) {
            if (err) return console.log(err);
            else {
                console.log("Parent file updated!")
            }
        });

    }
}

