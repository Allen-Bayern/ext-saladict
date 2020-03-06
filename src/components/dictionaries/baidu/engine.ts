import {
  MachineTranslateResult,
  SearchFunction,
  MachineTranslatePayload,
  GetSrcPageFunction,
  getMTArgs
} from '../helpers'
import { Baidu } from '@opentranslate/baidu'
import { BaiduLanguage } from './config'

let _translator: Baidu | undefined
const getTranslator = () =>
  (_translator =
    _translator ||
    new Baidu({
      env: 'ext',
      config:
        process.env.BAIDU_APPID && process.env.BAIDU_KEY
          ? {
              appid: process.env.BAIDU_APPID,
              key: process.env.BAIDU_KEY
            }
          : undefined
    }))

export const getSrcPage: GetSrcPageFunction = (text, config, profile) => {
  const lang =
    profile.dicts.all.baidu.options.tl === 'default'
      ? config.langCode === 'zh-CN'
        ? 'zh'
        : config.langCode === 'zh-TW'
        ? 'cht'
        : 'en'
      : profile.dicts.all.baidu.options.tl

  return `https://fanyi.baidu.com/#auto/${lang}/${text}`
}

export type BaiduResult = MachineTranslateResult<'baidu'>

export const search: SearchFunction<
  BaiduResult,
  MachineTranslatePayload<BaiduLanguage>
> = async (rawText, config, profile, payload) => {
  const translator = getTranslator()

  const { sl, tl, text } = await getMTArgs(
    translator,
    rawText,
    profile.dicts.all.baidu,
    config,
    payload
  )

  try {
    const result = await translator.translate(text, sl, tl)
    return {
      result: {
        id: 'baidu',
        sl: result.from,
        tl: result.to,
        langcodes: translator.getSupportLanguages(),
        searchText: result.origin,
        trans: result.trans
      },
      audio: {
        us: result.trans.tts
      }
    }
  } catch (e) {
    return {
      result: {
        id: 'baidu',
        sl,
        tl,
        langcodes: translator.getSupportLanguages(),
        searchText: { paragraphs: [''] },
        trans: { paragraphs: [''] }
      }
    }
  }
}
