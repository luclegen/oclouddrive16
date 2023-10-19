import React, { useEffect } from 'react'
import {
  useDispatch,
  useSelector
} from 'react-redux';
import { Progress } from 'reactstrap';
import {
  selectFactor,
  setFactor
} from './slice';
import FileType from '../../models/FileType';
import helper from '../../services/helper';
import { readPlaintext, savePlaintext, selectData, setData } from '../Files/slice';

export default function Media(props) {
  const dispatch = useDispatch()

  const factor = useSelector(selectFactor)
  const data = useSelector(selectData)

  useEffect(() => {
    window.onkeyup = e => {
      switch (e.keyCode) {
        case 32:
          props.type === FileType.VIDEO
            && (document.querySelector('.video').paused
              ? document.querySelector('.video').play()
              : document.querySelector('.video').pause())
          props.type === FileType.AUDIO
            && (document.querySelector('.audio').paused
              ? document.querySelector('.audio').play()
              : document.querySelector('.audio').pause())
          break;

        case 37:
          props.prev()
          break;

        case 39:
          props.next()
          break;

        case 83:
          if (e.ctrlKey) save()
          break;

        default:
          break;
      }
    }

    if (props.type === FileType.IMAGE || props.type === FileType.VIDEO) {
      const image = document.querySelector(`.${props.type}`)
      const bgMedia = document.querySelector('.bg-media')

      image.clientWidth / image.clientHeight > bgMedia.clientWidth / bgMedia.clientHeight
        ? image.style.width = '100vw'
        : image.style.height = 'calc(100vh - 53px)'

      document.querySelector('body').style.overflow = 'hidden'
    }

    if (props.type === FileType.TXT) dispatch(readPlaintext(helper.getQuery('fid')))
  }, [props.type])

  const download = () => window.open(`${process.env.NODE_ENV === 'production' ? window.location.origin + '/api' : process.env.REACT_APP_API}/files/d/` + helper.getQuery('fid'))

  const refresh = () => {
    if (props.type === FileType.IMAGE) {
      const image = document.querySelector('.image')
      const bgMedia = document.querySelector('.bg-media')

      image.style.height = 'auto'
      image.style.width = 'auto'
      image.style.transform = 'rotate(' + (factor * 90) + 'deg)'

      factor % 2
        ? image.clientHeight / image.clientWidth > bgMedia.clientWidth / bgMedia.clientHeight
          ? image.style.height = '100vw'
          : image.style.width = 'calc(100vh - 53px)'
        : image.clientWidth / image.clientHeight > bgMedia.clientWidth / bgMedia.clientHeight
          ? image.style.width = '100vw'
          : image.style.height = 'calc(100vh - 53px)'
    }
  }

  const rotateLeft = () => {
    dispatch(setFactor(factor + 1))
    refresh()
  }

  const rotateRight = () => {
    dispatch(setFactor(factor - 1))
    refresh()
  }

  const prev = () => new Promise(resolve => {
    dispatch(setFactor(0))
    resolve()
  })
    .then(() => {
      props.prev()
      refresh()
    })

  const next = () => new Promise(resolve => {
    dispatch(setFactor(0))
    resolve()
  })
    .then(() => {
      props.next()
      refresh()
    })

  const save = async () => alert((await dispatch(savePlaintext({ id: helper.getQuery('fid'), data }))).payload)

  return <section className="section-floating">
    <span className="command-bar">
      <span className="primary-command">
        <button className="btn-download" type="button" onClick={download}><i className="material-icons">download</i>Download</button>
        {props.type === FileType.IMAGE && <button className="btn-rotate-left" type="button" onClick={rotateLeft}><i className="material-icons">rotate_90_degrees_ccw</i>Rotate left 90°</button>}
        {props.type === FileType.IMAGE && <button className="btn-rotate-right" type="button" onClick={rotateRight}><i className="material-icons">rotate_90_degrees_cw</i>Rotate right 90°</button>}
        {props.type !== FileType.IMAGE && props.type !== FileType.TXT && <span className="left-space" style={{ width: '56px' }}></span>}
      </span>
      <span className="middle-command">
        <i className="material-icons">{props.type === FileType.IMAGE ? FileType.IMAGE : props.type === FileType.VIDEO ? 'video_file' : props.type === FileType.AUDIO ? 'audio_file' : props.type === FileType.NONE ? 'none' : ''}</i>
        <strong>&nbsp;{props.src.split('/')[props.src.split('/').length - 1]}</strong>
      </span>
      <span className="secondary-command">
        {props.type === FileType.TXT && <button className="btn-save" type="button" disabled={props.index === 1} onClick={save}><i className="material-icons">save</i>&nbsp;Save</button>}
        {props.type === FileType.IMAGE && <span className="right-space" style={{ width: '270px' }}></span>}
        {props.type !== FileType.TXT && <button className="btn-prev" type="button" disabled={props.index === 1} onClick={prev}><i className="material-icons">skip_previous</i></button>}
        {props.type !== FileType.TXT && <span className="span-index">&nbsp;&nbsp;{props.index + '/' + props.count}&nbsp;&nbsp;</span>}
        {props.type !== FileType.TXT && <button className="btn-next" type="button" disabled={props.index === props.count} onClick={next}><i className="material-icons">skip_next</i></button>}
        {props.type !== FileType.TXT && <button className="btn-close" type="button" onClick={props.close}><i className="material-icons">close</i></button>}
      </span>
    </span>
    {!!props.percent && <Progress value={props.percent} />}
    <span className="bg-media">
      {props.type === FileType.IMAGE
        ? <img className="image" src={props.src} alt="Image0" />
        : props.type === FileType.VIDEO
          ? < video className="video" src={props.src} autoPlay controls />
          : props.type === FileType.AUDIO
            ? <audio className="audio" src={props.src} autoPlay controls></audio>
            : props.type === FileType.TXT
              ? <textarea className="text-editor" name="text-editor" id="textEditor" value={data} onChange={e => dispatch(setData(e.target.value))}></textarea>
              : <span></span>
      }
    </span>
  </section>
}
