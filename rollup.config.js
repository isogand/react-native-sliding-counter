import {nodeResolve} from "@rollup/plugin-node-resolve";
import nodePolyfills from "rollup-plugin-polyfill-node";
import sourcemaps from "rollup-plugin-sourcemaps";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import fs from "fs/promises";
import globby from "globby";
import pkg from "./package.json";
import UglifyJS from "uglify-js";
import external from "@yelo/rollup-node-external";
import path from "path";

const __path = path;
const split = pkg.main.split("/");
const fileName = split[split.length - 1].split(".")[0];

const minify = () => {
    return {
        name: "minify",
        buildEnd: async () => {
            if (!PRODUCTION) {
                return;
            }
            const files = await globby(`lib/**/*.js`);
            for (const path1 of files) {
                await fs.writeFile(
                    path1,
                    UglifyJS.minify(await fs.readFile(path1, "utf8")).code,
                    "utf8"
                );
            }
        },
    };
};

export default [
    {
        input: `src/SlidingCounter.tsx`,
        plugins: [
            nodeResolve(),
            nodePolyfills(),
            sourcemaps(),
            commonjs(),
            typescript({
                clean: true,
                tsconfigOverride: {
                    compilerOptions: {
                        sourceMap: true,
                    },
                },
            }),
            minify,
        ],
        external: external(),
        output: [
            {
                file: `lib/${fileName}.es.js`,
                format: "es",
                sourcemap: true,
                globals: [],
            },
        ],
    }
];
