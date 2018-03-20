import singleSpaReact from './single-spa-react.js'

describe('single-spa-react', () => {
  let React, ReactDOM, rootComponent, domElement, domElementGetter, componentInstance, createdReactElement

  beforeEach(() => {
    React = {
      createElement: jest.fn(() => {
        return createdReactElement
      }),
      version: '16.2.0',
    },
    ReactDOM = {
      render: jest.fn((reactEl, domEl, cbk) => {
        cbk()
        return componentInstance
      }),
      unmountComponentAtNode: jest.fn()
    }

    createdReactElement = "Hey a created react element"
    componentInstance = {componentDidCatch: () => {}}
    rootComponent = jest.fn()
    domElement = "Hey i'm the dom element"
    domElementGetter = () => domElement

    console.warn = jest.fn()
  })

  it(`throws an error if you don't pass required opts`, () => {
    expect(() => singleSpaReact()).toThrow()
    expect(() => singleSpaReact({})).toThrow()
    expect(() => singleSpaReact({ReactDOM, rootComponent})).toThrow()
    expect(() => singleSpaReact({React, rootComponent})).toThrow()
    expect(() => singleSpaReact({React, ReactDOM})).toThrow()
  })

  it(`mounts and unmounts a React component, passing through the single-spa props`, () => {
    const props = {why: 'hello', customProps: {}}
    const lifecycles = singleSpaReact({React, ReactDOM, rootComponent, domElementGetter})

    return lifecycles
      .bootstrap()
      .then(() => lifecycles.mount(props))
      .then(() => {
        expect(React.createElement).toHaveBeenCalled()
        expect(React.createElement.mock.calls[0][0]).toEqual(rootComponent)
        expect(React.createElement.mock.calls[0][1]).toEqual(props)
        expect(ReactDOM.render).toHaveBeenCalled()
        expect(ReactDOM.render.mock.calls[0][0]).toEqual(createdReactElement)
        expect(ReactDOM.render.mock.calls[0][1]).toEqual(domElement)
        expect(typeof ReactDOM.render.mock.calls[0][2]).toEqual('function')
        return lifecycles.unmount(props)
      })
      .then(() => {
        expect(ReactDOM.unmountComponentAtNode).toHaveBeenCalledWith(domElement)
      })
  })

  it(`chooses the parcel dom element over other dom element getters`, () => {
    const optsDomElementGetter = () => 'optsDomElementGetter'
    let opts = {React, ReactDOM, rootComponent, domElementGetter: optsDomElementGetter}
    let propsDomElementGetter = () => 'propsDomElementGetter'
    let propsDomElement = () => 'propsDomElement'
    let props = {customProps: {domElement: propsDomElement, domElementGetter: propsDomElementGetter}}

    const lifecycles = singleSpaReact(opts)

    return lifecycles
      .bootstrap()
      .then(() => lifecycles.mount(props))
      .then(() => lifecycles.unmount(props))
      .then(() => {
        expect(ReactDOM.render).toHaveBeenCalled()
        // prefer customProp dom element over everything because it's how parcels work
        expect(ReactDOM.render.mock.calls[0][1]).toBe(propsDomElement)
      })
  })

  it(`allows you to provide a domElementGetter as an opt`, () => {
    const props = {why: 'hello', customProps: {}}
    const lifecycles = singleSpaReact({React, ReactDOM, rootComponent, domElementGetter})

    return lifecycles
      .bootstrap()
      .then(() => lifecycles.mount(props))
      // Doesn't throw
  })

  it(`allows you to provide a domElementGetter as a customProps`, () => {
    const props = {why: 'hello', customProps: {domElementGetter}}
    const lifecycles = singleSpaReact({React, ReactDOM, rootComponent})

    return lifecycles
      .bootstrap()
      .then(() => lifecycles.mount(props))
    // Doesn't throw
  })

  it(`throws if you provide no way of getting a dom element`, () => {
    let opts = {React, ReactDOM, rootComponent}
    let props = {customProps: {}}

    const lifecycles = singleSpaReact(opts)

    return lifecycles
      .bootstrap()
      .then(() => lifecycles.mount(props))
      .then(
        () => Promise.reject('expected error because no dom element'),
        () => Promise.resolve('error expected because no dom element')
      )
  })

  it(`warns if you are using react 16 but don't implement componentDidCatch`, () => {
    delete componentInstance.componentDidCatch
    React.version = '16.2.0'
    const props = {why: 'hello', customProps: {}}
    const lifecycles = singleSpaReact({React, ReactDOM, rootComponent, domElementGetter})

    return lifecycles
      .bootstrap()
      .then(() => expect(console.warn).not.toHaveBeenCalled())
      .then(() => lifecycles.mount(props))
      .then(() => expect(console.warn).toHaveBeenCalled())
  })

  it(`does not warn if you are using react 15 but don't implement componentDidCatch`, () => {
    delete componentInstance.componentDidCatch
    React.version = '15.4.1'
    const props = {why: 'hello', customProps: {}}
    const lifecycles = singleSpaReact({React, ReactDOM, rootComponent, domElementGetter})

    return lifecycles
      .bootstrap()
      .then(() => lifecycles.mount(props))
      .then(() => expect(console.warn).not.toHaveBeenCalled())
  })
})