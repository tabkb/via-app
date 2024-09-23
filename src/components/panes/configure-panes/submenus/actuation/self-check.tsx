import {FC} from 'react';
import {useTranslation} from 'react-i18next';
import {AccentButton} from 'src/components/inputs/accent-button';
import {
  getSelfCheckTimeout,
  getSelfChecked,
  selfCheck,
} from 'src/store/actuationSlice';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';

export const SelfCheck: FC = () => {
  const dispatch = useAppDispatch();
  const {t} = useTranslation();
  const selfChecked = useAppSelector(getSelfChecked);
  const selfCheckTimeout = useAppSelector(getSelfCheckTimeout);

  return (
    <>
      <AccentButton onClick={() => dispatch(selfCheck())}>
        {selfCheckTimeout === -1
          ? t('Check Failed, Retry')
          : selfChecked
          ? t('Recheck')
          : t('Self Check')}
        {selfCheckTimeout > 0 && ` , ${t('Wait')} ${selfCheckTimeout} ${t('S')}`}
      </AccentButton>
    </>
  );
};
