#!/usr/bin/env bash

# set current working directory to the directory of this script:
cd `dirname $0`

# create assets directory:
mkdir -p assets/

# copy WASM distribution:
cp node_modules/onnxruntime-web/dist/ort-wasm-simd.wasm assets/

# copy Policy-Value Network in ONNX format:
cp ../training/stage2/policy_value_net_100000.onnx assets/policy_value_net_stage2.onnx

# create init.onnx asset:
python3 export_init_onnx.py --init_onnx_path assets/init.onnx

# copy favicon assets:
cp logo/favicon/android-chrome-192x192.png assets/
cp logo/favicon/android-chrome-512x512.png assets/
cp logo/favicon/apple-touch-icon.png assets/
cp logo/favicon/browserconfig.xml assets/
cp logo/favicon/favicon.ico assets/
cp logo/favicon/favicon-16x16.png assets/
cp logo/favicon/favicon-32x32.png assets/
cp logo/favicon/mstile-70x70.png assets/
cp logo/favicon/mstile-144x144.png assets/
cp logo/favicon/mstile-150x150.png assets/
cp logo/favicon/mstile-310x150.png assets/
cp logo/favicon/mstile-310x310.png assets/
cp logo/favicon/safari-pinned-tab.svg assets/
cp logo/favicon/site.webmanifest assets/

# copy open graph image:
cp logo/open_graph_image.png assets/

# copy twitter summary image:
cp logo/twitter_summary_image.png assets/
