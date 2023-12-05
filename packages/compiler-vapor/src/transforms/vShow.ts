import { IRNodeTypes } from '../ir'
import { DirectiveTransform } from '../transform'
import { DOMErrorCodes, createDOMCompilerError } from '@vue/compiler-dom'

export const transformVShow: DirectiveTransform = (dir, node, context) => {
  const { exp, loc } = dir
  if (!exp) {
    context.options.onError(
      createDOMCompilerError(DOMErrorCodes.X_V_SHOW_NO_EXPRESSION, loc),
    )
  }

  context.registerEffect(
    [exp],
    [
      {
        type: IRNodeTypes.SET_SHOW,
        loc: dir.loc,
        element: context.reference(),
        value: exp || '""',
      },
    ],
  )
}
