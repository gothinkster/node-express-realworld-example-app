const SUSPECT = /(password|passwd|secret|token|api_?key)/i;
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Proíbe segredos escritos direto no código' },
    messages: {
      hardcoded: 'Não escreva "{{name}}" no código; use variável de ambiente.',
    },
    schema: [],
  },

  create(context) {
    return {
      VariableDeclarator(node) {
        const isSuspectName = node.id.type === 'Identifier' && SUSPECT.test(node.id.name);
        const isFixedText =
          node.init?.type === 'Literal' &&
          typeof node.init.value === 'string' &&
          node.init.value !== '';
        if (isSuspectName && isFixedText) {
          context.report({ node, messageId: 'hardcoded', data: { name: node.id.name } });
        }
      },
    };
  },
};
