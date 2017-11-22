import fs from "fs-extra";
import cp from "child_process";

const config = eval(fs.readFileSync(process.argv[2]).toString());

fs.ensureDir(config.folder);
const repo = `${config.folder}/source`;
const workspace = `${config.folder}/workspace`;
const releases = `${config.folder}/releases`;
fs.ensureDir(releases);

if (fs.pathExistsSync(repo)) {
	cp.execSync(`git fetch`, { cwd: repo });
	cp.execSync(`git checkout ${config.branch}`, { cwd: repo });
	cp.execSync(`git pull`, { cwd: repo });
} else {
	cp.execSync(`git clone -b ${config.branch} ${config.git} source`, { cwd: config.folder });
}
fs.copySync(repo, workspace, { filter: (src, dest) => src.match(/\.git/) === null });
cp.execSync(config.build, { cwd: workspace });

const now = (new Date()).toISOString().replace(/:/g, "-");
const lastRelease = `${releases}/${now}`;
const current = `${releases}/current`;

fs.moveSync(workspace, lastRelease);
cp.execSync(`ln -sf ${lastRelease} ${current}`);

if (fs.pathExistsSync(`${releases}/naught.ipc`)) {
	cp.execSync(`naught deploy --cwd ${lastRelease}`, { cwd: releases });
} else {
	cp.execSync(`naught start --cwd ${lastRelease} ${current}/${config.start}`, { cwd: releases });
}
