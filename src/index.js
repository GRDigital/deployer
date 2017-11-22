import fs from "fs-extra";
import cp from "child_process";

const config = eval(fs.readFileSync(process.argv[2]).toString());
console.log(config);

fs.ensureDir(config.folder);
const repo = `${config.folder}/source`;
const workspace = `${config.folder}/workspace`;
const releases = `${config.folder}/releases`;
fs.ensureDir(releases);

console.log("exists?", fs.pathExistsSync(repo));

if (fs.pathExistsSync(repo)) {
	cp.execSync(`git pull`, { cwd: repo });
} else {
	cp.execSync(`git clone -b ${config.branch} ${config.git} source`, { cwd: config.folder });
}
fs.copySync(repo, workspace, { filter: (src, dest) => src.match(/\.git/) !== null });
cp.execSync(config.build, { cwd: workspace });

let i = 0;
while (fs.pathExistsSync(`${releases}/${i}`)) i += 1;
fs.moveSync(workspace, `${releases}/${i}`);

cp.execSync(config.start, { cwd: `${releases}/${i}` });
