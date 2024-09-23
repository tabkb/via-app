const fs = require('fs');
const {createHmac} = require('node:crypto');
const path = require('path');
const glob = require('glob');

if (!fs.existsSync('public/tabkb')) {
  fs.mkdirSync('public/tabkb');
}
if (!fs.existsSync('public/definitions')) {
  fs.mkdirSync('public/definitions');
}
if (!fs.existsSync('public/definitions/v3')) {
  fs.mkdirSync('public/definitions/v3');
}

const {
  keyboardDefinitionV3ToVIADefinitionV3,
  keyboardDefinitionV2ToVIADefinitionV2,
  isKeyboardDefinitionV2,
  isVIADefinitionV2,
  isKeyboardDefinitionV3,
  isVIADefinitionV3,
} = require('@the-via/reader');

const hashJSON = (json) => {
  const hmac = createHmac('sha256', 'a secret');
  hmac.update(JSON.stringify(json));
  return hmac.digest('hex');
};

function buildDefinitions() {
  const tabkbPath = path.resolve('public/tabkb');
  const definitionsPath = path.resolve('public/definitions');
  if (!fs.existsSync(tabkbPath)) {
    return;
  }

  const paths = glob.sync(path.join(tabkbPath, 'definitions', '*.json'), {
    absolute: true,
  });

  const v2Ids = [];
  const v3Ids = [];
  const tabDefs = [];

  paths.map((f) => {
    const res = require(f);
    let version;
    if (isKeyboardDefinitionV2(res) || isVIADefinitionV2(res)) {
      version = 'v2';
    } else if (isKeyboardDefinitionV3(res) || isVIADefinitionV3(res)) {
      version = 'v3';
    }
    if (!version) {
      console.log('Invalid definition: ', f);
      return;
    }

    const definition =
      version === 'v2'
        ? isVIADefinitionV2(res)
          ? res
          : keyboardDefinitionV2ToVIADefinitionV2(res)
        : isVIADefinitionV3(res)
        ? res
        : keyboardDefinitionV3ToVIADefinitionV3(res);

    if (version === 'v2') {
      v2Ids.push(definition.vendorProductId);
    } else {
      v3Ids.push(definition.vendorProductId);
    }

    tabDefs.push(definition);

    const file = path.join(
      definitionsPath,
      version,
      `${definition.vendorProductId}.json`,
    );

    fs.writeFileSync(file, JSON.stringify(definition));
  });

  fs.writeFileSync(
    `${tabkbPath}/supported_kbs.json`,
    JSON.stringify(
      {
        v2: v2Ids,
        v3: v3Ids,
      },
      null,
      2,
    ),
  );

  // const hash = JSON.parse(fs.readFileSync(`${definitionsPath}/hash.json`));
  const tabHash = hashJSON(tabDefs);
  // const newHash = hash.substr(0, 64) + tabHash;
  const newHash = tabHash;

  fs.writeFileSync(`${definitionsPath}/hash.json`, JSON.stringify(newHash));
}

function buildConfigs() {
  const tabkbPath = path.resolve('public/tabkb');
  const paths = glob.sync(path.join(tabkbPath, 'configs', '*.json'), {
    absolute: true,
  });
  const configs = [];
  paths.map((f) => configs.push(require(f)));
  fs.writeFileSync(
    `${tabkbPath}/configs.json`,
    JSON.stringify(configs, null, 2),
  );
}

buildDefinitions();
buildConfigs();
