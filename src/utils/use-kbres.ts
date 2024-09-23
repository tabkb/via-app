import {useEffect, useState} from 'react';

import createModule from './kbres/kbres.mjs';
import {MainModule} from './kbres/kbres';

type Module = MainModule & {FS: typeof FS};
let module: Module;

export const useKbres = () => {
  const [kbres, setKbres] = useState<Module | null>(null);
  useEffect(() => {
    if (module !== undefined) {
      setKbres(module);
      return;
    }
    createModule()
      .then((m: Module) => {
        module = m;
        setKbres(m);
      })
      .catch((e: Error) => {
        console.log(e);
      });
  }, []);

  return kbres;
};
