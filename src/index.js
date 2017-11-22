import fs from "fs-extra";
import cp from "child_process";

const config = eval(fs.readFileSync(process.argv[2]).toString());

fs.ensureDir(config.folder);
const repo = `${config.folder}/source`;
const workspace = `${config.folder}/workspace`;
const releases = `${config.folder}/releases`;
fs.ensureDir(releases);

const exec = (cmd, cwd) => {
	if (cwd) {
		console.log(`${cwd} -> ${cmd}`);
		cp.execSync(cmd, { cwd });
	} else {
		console.log(cmd);
		cp.execSync(cmd);
	}
};

if (fs.pathExistsSync(repo)) {
	exec(`git fetch`, repo);
	exec(`git checkout ${config.branch}`, repo);
	exec(`git pull`, repo);
} else {
	exec(`git clone -b ${config.branch} ${config.git} source`, config.folder);
}
fs.copySync(repo, workspace, { filter: (src, dest) => src.match(/\.git/) === null });
exec(config.build, workspace);

const now = (new Date()).toISOString().replace(/:/g, "-");
const lastRelease = `${releases}/${now}`;

fs.moveSync(workspace, lastRelease);
exec(`ln -sfn ${now} current`, releases);

if (fs.pathExistsSync(`${releases}/naught.ipc`)) {
	exec(`naught deploy --cwd ${now}`, releases);
} else {
	exec(`naught start --cwd ${now} current/${config.start}`, releases);
}
