import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import InputIcon from '@mui/icons-material/Input';
import LaunchIcon from '@mui/icons-material/Launch';
import { selectOpened, open } from './slice';
import { check, login, setRemember, selectRemember, selectLang } from '../../slice';
import Registration from '../Registration';
import helper from '../../services/helper';

export default function Login() {
  const { t } = useTranslation()
  const dispatch = useDispatch();

  const remember = useSelector(selectRemember);
  const language = useSelector(selectLang);
  const opened = useSelector(selectOpened);

  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(
    () => window.onbeforeunload = () =>
      email || password || remember ? true : undefined
  );

  const enterEmail = (e) =>
    e.target.value &&
    new Promise((resolve) => {
      dispatch(check(e.target.value)).then((action) =>
        e.target.setCustomValidity(
          helper.isEmail(e.target.value)
            ? action.payload
              ? t('Email not registered.')
              : ''
            : t('Invalid email!')
        )
      );
      setVisible(false);
      setPassword('');
      resolve();
    }).then(() => {
      if (document.querySelector('.input-group-password')) { document.querySelector('.input-group-password').style.height = 0; }
      document.querySelector('.input-email').style.width = 205 + 'px';
    });

  const submit = (e) =>
    e.preventDefault() ||
    (email &&
      new Promise((resolve) => setVisible(true) || resolve()).then(() => {
        document.querySelector('.input-group-password').style.height =
          39 + 'px';
        document.querySelector('.input-email').style.width = 253 + 'px';
        document.querySelector('.input-password').focus();

        if (password) {
          dispatch(login({ email, password, remember, language }))
            .then(action => {
              if (action.type === 'app/login/rejected') setPassword('')
              else if (action.type === 'app/login/fulfilled') {
                setPassword('')
                setEmail('')
                setRemember(false)
              }
            })
        }
      }))

  return (
    <section className="section-only">
      <form className="form-only" onSubmit={submit}>
        <img
          className="logo-img"
          src="/logo.svg"
          alt={process.env.REACT_APP_NAME + ' logo'}
        />
        <h1 className="h1-only">{t('Sign in to')} {process.env.REACT_APP_NAME}</h1>
        <div
          className={`input-group-email ${visible ? 'rounded-top' : 'rounded'}`}
        >
          <input
            className="input-email"
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            pattern={helper.emailPattern}
            onInput={enterEmail}
            onInvalid={enterEmail}
            onChange={(e) => setEmail(e.target.value)}
            title="Please fill out this field."
            required
          />
          {!visible && (
            <button
              className="btn-input"
              title={t('Next')}
              type="submit"
              disabled={!email}
              hidden={true}
            >
              <InputIcon />
            </button>
          )}
        </div>
        <div className="input-group-container">
          {visible && email && (
            <div className="input-group-password">
              <input
                className="input-password"
                type="password"
                name="password"
                placeholder={t('Password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="btn-input"
                title={t('Next')}
                type="submit"
                disabled={!password}>
                <InputIcon />
              </button>
            </div>
          )}
        </div>
        <div className="form-check-remember">
          <input
            className="remember-me-input"
            id="rememberLogin"
            type="checkbox"
            name="remember"
            value={remember}
            onChange={(e) => dispatch(setRemember(e.target.checked))}
          />
          <label className="remember-me-label" htmlFor="rememberLogin">
            {t('Keep me signed in')}
          </label>
        </div>
        <a
          className="link-find-account"
          href="/find-account"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('Forgotten password?')}&nbsp;<LaunchIcon />
        </a>
        <button
          className="btn-create-account"
          type="button"
          onClick={() => dispatch(open())}
        >
          {t('Create New Account')}
        </button>
      </form>
      {opened && <Registration />}
    </section>
  );
}
