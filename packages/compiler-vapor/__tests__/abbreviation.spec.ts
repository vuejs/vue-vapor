/*
 * @Date: 2024-04-21 15:29:37
 * @Description:
 */
/**
 * @vitest-environment jsdom
 */
import {
  compile as _compile,
  transformChildren,
  transformElement,
  transformText,
} from '../src'
import { makeCompile } from './transforms/_utils'
const parser = new DOMParser()

function parseHTML(html: string) {
  return parser.parseFromString(html, 'text/html').body.innerHTML
}

const compileWithElementTransform = makeCompile({
  nodeTransforms: [transformElement, transformChildren, transformText],
})

function checkAbbr(template: string, abbrevation: string, expected: string) {
  // TODO do some optimzations to make sure template === abbrevation
  const { ir } = compileWithElementTransform(template)
  const templateOfIr = ir.template
  abbrevation = templateOfIr.reduce((cur, next) => cur + next)
  expect(parseHTML(abbrevation)).toBe(expected)
}

test('template abbreviation', () => {
  checkAbbr('<div>hello</div>', '<div>hello', '<div>hello</div>')
  checkAbbr(
    '<div><div>hello</div></div>',
    '<div><div>hello',
    '<div><div>hello</div></div>',
  )
  checkAbbr(
    '<div><span>foo</span><span/></div>',
    '<div><span>foo</span><span>',
    '<div><span>foo</span><span></span></div>',
  )
  checkAbbr(
    '<div><hr/><div/></div>',
    '<div><hr><div>',
    '<div><hr><div></div></div>',
  )
  checkAbbr(
    '<div><div/><hr/></div>',
    '<div><div></div><hr>',
    '<div><div></div><hr></div>',
  )

  checkAbbr('<span/>hello', '<span></span>hello', '<span></span>hello')
})
