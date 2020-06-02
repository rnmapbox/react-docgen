import { parse, parseWithTemplate, noopImporter, makeMockImporter } from '../../../tests/utils';
import componentMethodsHandler from '../componentMethodsHandler';
import Documentation from '../../Documentation';
import DocumentationMock from '../../__mocks__/Documentation';

jest.mock('../../Documentation');

describe('componentMethodsHandler', () => {
  let documentation: Documentation & DocumentationMock;

  beforeEach(() => {
    documentation = new Documentation() as Documentation & DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    baz: parse(`
      export default (foo: string): string => {};
    `).get('body', 0, 'declaration'),

    foo: parse(`
      export default function(bar: number): number {
        return bar;
      }
    `).get('body', 0, 'declaration'),

    doFoo: parse(`
      export default () => {};
    `).get('body', 0, 'declaration'),
  });

  function test(definition, importer) {
    componentMethodsHandler(documentation, definition, importer);
    expect(documentation.methods).toEqual([
      {
        name: 'foo',
        docblock: 'The foo method',
        modifiers: [],
        returns: {
          type: { name: 'number' },
        },
        params: [
          {
            name: 'bar',
            type: { name: 'number' },
          },
        ],
      },
      {
        name: 'baz',
        docblock: '"arrow function method"',
        modifiers: [],
        returns: {
          type: { name: 'string' },
        },
        params: [
          {
            name: 'foo',
            type: { name: 'string' },
          },
        ],
      },
      {
        name: 'bar',
        docblock: 'Static function',
        modifiers: ['static'],
        returns: null,
        params: [],
      },
    ]);
  }

  it('extracts the documentation for an ObjectExpression', () => {
    const src = `
      ({
        /**
         * The foo method
         */
        foo(bar: number): number {
          return bar;
        },
        /**
         * "arrow function method"
         */
        baz: (foo: string): string => {},
        statics: {
          /**
           * Static function
           */
          bar() {}
        },
        state: {
          foo: 'foo',
        },
        componentDidMount() {},
        render() {
          return null;
        },
      })
    `;

    test(parse(src).get('body', 0, 'expression'), noopImporter);
  });

  it('can resolve an imported method on an ObjectExpression', () => {
    const src = `
      import baz from 'baz';
      ({
        /**
         * The foo method
         */
        foo(bar: number): number {
          return bar;
        },
        /**
         * "arrow function method"
         */
        baz: baz,
        statics: {
          /**
           * Static function
           */
          bar() {}
        },
        state: {
          foo: 'foo',
        },
        componentDidMount() {},
        render() {
          return null;
        },
      })
    `;

    test(parse(src).get('body', 1, 'expression'), mockImporter);
  });

  it('extracts the documentation for a ClassDeclaration', () => {
    const src = `
      class Test extends React.Component {
        /**
         * The foo method
         */
        foo(bar: number): number {
          return bar;
        }

        /**
         * "arrow function method"
         */
        baz = (foo: string): string => {};

        /**
         * Static function
         */
        static bar() {}

        state = {
          foo: 'foo',
        };

        componentDidMount() {}

        render() {
          return null;
        }
      }
    `;

    test(parse(src).get('body', 0), noopImporter);
  });

  it('can resolve an imported method on a ClassDeclaration', () => {
    const src = `
      import baz from 'baz';
      class Test extends React.Component {
        /**
         * The foo method
         */
        foo(bar: number): number {
          return bar;
        }

        /**
         * "arrow function method"
         */
        baz = baz;

        /**
         * Static function
         */
        static bar() {}

        state = {
          foo: 'foo',
        };

        componentDidMount() {}

        render() {
          return null;
        }
      }
    `;

    test(parse(src).get('body', 1), mockImporter);
  });

  it('should handle and ignore computed methods', () => {
    const src = `
      class Test extends React.Component {
        /**
         * The foo method
         */
        [foo](bar: number): number {
          return bar;
        }

        /**
         * Should not show up
         */
        [() => {}](bar: number): number {
          return bar;
        }

        componentDidMount() {}

        render() {
          return null;
        }
      }
    `;

    componentMethodsHandler(
      documentation,
      parse(src).get('body', 0),
      noopImporter,
    );
    expect(documentation.methods).toMatchSnapshot();
  });

  it('resolves imported methods assigned to computed properties', () => {
    const src = `
      import foo from 'foo';
      class Test extends React.Component {
        /**
         * The foo method
         */
        [foo] = foo;

        /**
         * Should not show up
         */
        [() => {}](bar: number): number {
          return bar;
        }

        componentDidMount() {}

        render() {
          return null;
        }
      }
    `;

    componentMethodsHandler(
      documentation,
      parse(src).get('body', 1),
      mockImporter,
    );
    expect(documentation.methods).toMatchSnapshot();
  });

  it('should handle and ignore private properties', () => {
    const src = `
      class Test extends React.Component {
        #privateProperty = () => {
          console.log('Do something');
        }

        componentDidMount() {}

        render() {
          return null;
        }
      }
    `;

    componentMethodsHandler(
      documentation,
      parse(src).get('body', 0),
      noopImporter,
    );
    expect((documentation.methods as unknown[]).length).toBe(0);
  });

  describe('function components', () => {
    it('no methods', () => {
      const src = `
        (props) => {}
      `;

      const definition = parse(src).get('body', 0, 'expression');
      componentMethodsHandler(documentation, definition, noopImporter);
      expect(documentation.methods).toEqual([]);
    });

    it('finds static methods on a component in a variable declaration', () => {
      const src = `
        const Test = (props) => {};
        Test.doFoo = () => {};
        Test.doBar = () => {};
        Test.displayName = 'Test'; // Not a method
      `;

      componentMethodsHandler(
        documentation,
        parse(src).get('body', 0, 'declarations', 0, 'init'),
        noopImporter,
      );
      expect(documentation.methods).toMatchSnapshot();
    });

    it('resolves imported methods assigned to static properties on a component', () => {
      const src = `
        const Test = (props) => {};
        import doFoo from 'doFoo';
        Test.doFoo = doFoo;
      `;

      componentMethodsHandler(
        documentation,
        parse(src).get('body', 0, 'declarations', 0, 'init'),
        mockImporter,
      );
      expect(documentation.methods).toMatchSnapshot();
    });

    it('finds static methods on a component in an assignment', () => {
      const src = `
        Test = (props) => {};
        Test.doFoo = () => {};
        Test.doBar = () => {};
        Test.displayName = 'Test'; // Not a method
      `;

      componentMethodsHandler(
        documentation,
        parse(src).get('body', 0, 'expression', 'right'),
        noopImporter,
      );
      expect(documentation.methods).toMatchSnapshot();
    });

    it('resolves imported methods assigned on a component in an assignment', () => {
      const src = `
        Test = (props) => {};
        import doFoo from 'doFoo';
        Test.doFoo = doFoo;
      `;

      componentMethodsHandler(
        documentation,
        parse(src).get('body', 0, 'expression', 'right'),
        mockImporter,
      );
      expect(documentation.methods).toMatchSnapshot();
    });

    it('finds static methods on a function declaration', () => {
      const src = `
        function Test(props) {}
        Test.doFoo = () => {};
        Test.doBar = () => {};
        Test.displayName = 'Test'; // Not a method
      `;

      componentMethodsHandler(
        documentation,
        parse(src).get('body', 0),
        noopImporter,
      );
      expect(documentation.methods).toMatchSnapshot();
    });

    it('resolves imported methods on a function declaration', () => {
      const src = `
        function Test(props) {}
        import doFoo from 'doFoo';
        Test.doFoo = doFoo;
      `;

      componentMethodsHandler(
        documentation,
        parse(src).get('body', 0),
        mockImporter,
      );
      expect(documentation.methods).toMatchSnapshot();
    });
  });

  describe('useImperativeHandle() methods', () => {
    // We're not worried about doc-blocks here, simply about finding method(s)
    // defined via the useImperativeHandle() hook.
    const IMPERATIVE_TEMPLATE = [
      'import React, { useImperativeHandle } from "react";',
      '%s',
    ].join('\n');

    // To simplify the variations, each one ends up with the following in the
    // parsed body:
    //
    // [0]: the react import
    // [1]: the initial definition/declaration
    // [2]: a React.forwardRef wrapper (or nothing)
    //
    // Note that in the cases where the React.forwardRef is used "inline" with
    // the definition/declaration, there is no [2], and it will be skipped.

    function testImperative(src) {
      const parsed = parseWithTemplate(src, IMPERATIVE_TEMPLATE);
      [1, 2].forEach(index => {
        // // reset the documentation, since we may test more than once!
        // documentation = new (require('../../Documentation'))();

        const definition = parsed.get('body', index);
        // console.log(`def ${index}`, definition);
        if (!definition.value) {
          return;
        }
        componentMethodsHandler(documentation, definition, noopImporter);
        expect(documentation.methods).toEqual([
          {
            docblock: null,
            modifiers: [],
            name: 'doFoo',
            params: [],
            returns: null,
          },
        ]);
      });
    }

    it('finds inside a component in a variable declaration', () => {
      testImperative(`
      const Test = (props, ref) => {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      };
      React.forwardRef(Test);
      `);
    });

    it('finds inside a component in an assignment', () => {
      testImperative(`
      Test = (props, ref) => {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      };
      `);
    });

    it('finds inside a function declaration', () => {
      testImperative(`
      function Test(props, ref) {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      }
      React.forwardRef(Test);
      `);
    });

    it('finds inside an inlined React.forwardRef call with arrow function', () => {
      testImperative(`
      React.forwardRef((props, ref) => {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      });
      `);
    });

    it('finds inside an inlined React.forwardRef call with plain function', () => {
      testImperative(`
      React.forwardRef(function(props, ref) {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      });
      `);
    });
  });
});
