import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'

const portalCalls = vi.hoisted(() => [] as { node: unknown; container: unknown }[])

vi.mock('react-dom', () => ({
  createPortal: (node: unknown, container: unknown) => {
    portalCalls.push({ node, container })
    return node
  },
}))

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  IconChevronDownOutlineMedium: () => null,
  IconChevronRightOutlineMedium: () => null,
  IconRefreshOutlineMedium: () => null,
  StateDot: () => null,
}))

import { catalogMenuPosition, SubagentCatalogAction } from '../src/client/SubagentCatalogAction.tsx'

describe('catalogMenuPosition', () => {
  it('places the menu below the trigger at its left edge', () => {
    expect(catalogMenuPosition({ left: 100, bottom: 40 }, 1000)).toEqual({ top: 45, left: 100 })
  })

  it('clamps the left edge at the right viewport margin', () => {
    expect(catalogMenuPosition({ left: 900, bottom: 40 }, 1000)).toEqual({ top: 45, left: 648 })
  })

  it('clamps the left edge at the left viewport margin', () => {
    expect(catalogMenuPosition({ left: 0, bottom: 40 }, 1000)).toEqual({ top: 45, left: 16 })
  })

  it('accounts for the narrower menu below 368px', () => {
    expect(catalogMenuPosition({ left: 300, bottom: 40 }, 320)).toEqual({ top: 45, left: 16 })
  })
})

let activeElement: FakeNode | null = null

class FakeNode {
  readonly children = new Set<FakeNode>()
  items: FakeNode[] = []
  rect = { left: 100, bottom: 40 }

  contains(target: FakeNode): boolean {
    return target === this || this.children.has(target)
  }

  querySelectorAll(): FakeNode[] {
    return this.items
  }

  getBoundingClientRect() {
    return this.rect
  }

  focus(): void {
    activeElement = this
  }
}

let tree: ReactTestRenderer | undefined
let rootNode: FakeNode
let triggerNode: FakeNode
let menuNode: FakeNode | undefined
let itemNodes: FakeNode[] = []

function setup() {
  activeElement = null
  itemNodes = []
  menuNode = undefined
  const documentMock = {
    body: new FakeNode(),
    get activeElement() { return activeElement },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  const windowMock = {
    innerWidth: 1000,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('document', documentMock)
  vi.stubGlobal('window', windowMock)
  vi.stubGlobal('Node', FakeNode)

  const entries = [
    { id: 'child-1', mode: 'continuable', label: 'Child one' },
    { id: 'child-2', mode: 'continuable', label: 'Child two' },
  ]
  const byId = {
    root: { id: 'root', running: false, projectionValues: {} },
    ...Object.fromEntries(entries.map(entry => [entry.id, {
      id: entry.id,
      origin: 'subagent',
      parentId: 'root',
      running: false,
      title: entry.label,
      projectionValues: {},
    }])),
  }
  const sessionState = {
    byId,
    projectionsBySession: {
      root: {
        state: 'idle',
        values: { subagentCatalog: entries },
        error: null,
      },
    },
  }
  const labelSnapshot = { value: {} }
  const props = {
    sessionId: 'root',
    useSessions: (select: (state: typeof sessionState) => unknown) => select(sessionState),
    useSessionStatus: (select: (state: Map<string, { running: boolean }>) => unknown) => select(new Map()),
    openChild: vi.fn(),
    refresh: vi.fn(),
    labels: {
      subscribe: () => () => {},
      getSnapshot: () => labelSnapshot,
      start: vi.fn(),
      stop: vi.fn(),
    },
    t: (key: string) => key,
  }

  act(() => {
    tree = create(createElement(SubagentCatalogAction, props as never), {
      createNodeMock: (element) => {
        if (element.type === 'button' && element.props['aria-haspopup'] === 'tree') {
          triggerNode = new FakeNode()
          return triggerNode
        }
        if (element.props.role === 'tree') {
          menuNode = new FakeNode()
          return menuNode
        }
        if (element.type === 'div' && element.props.role === undefined && element.props.onKeyDown !== undefined) {
          rootNode = new FakeNode()
          return rootNode
        }
        return new FakeNode()
      },
    })
  })
  rootNode.children.add(triggerNode)
  return { documentMock, windowMock }
}

function trigger() {
  return tree!.root.findByProps({ 'aria-haspopup': 'tree' })
}

function root() {
  return tree!.root.find(node => node.type === 'div'
    && node.props.role === undefined
    && node.props.onKeyDown !== undefined)
}

function menus() {
  return tree!.root.findAllByProps({ role: 'tree' })
}

function openMenu() {
  act(() => { trigger().props.onClick() })
  menuNode ??= new FakeNode()
  itemNodes = [new FakeNode(), new FakeNode()]
  menuNode.items = itemNodes
  for (const item of itemNodes) menuNode.children.add(item)
}

afterEach(() => {
  if (tree) act(() => tree!.unmount())
  tree = undefined
  portalCalls.length = 0
  activeElement = null
  vi.unstubAllGlobals()
})

describe('SubagentCatalogAction portal menu', () => {
  it('portals to document.body with a fixed position calculated from the trigger', () => {
    const { documentMock } = setup()
    openMenu()
    expect(portalCalls.at(-1)?.container).toBe(documentMock.body)
    expect(menus()).toHaveLength(1)
    expect(menus()[0]!.props.style).toEqual({ top: 45, left: 100 })
  })

  it('keeps pointerdown inside the portal open and closes only for outside targets', () => {
    const { documentMock } = setup()
    openMenu()
    const closeOutside = documentMock.addEventListener.mock.calls
      .find(([type]) => type === 'pointerdown')?.[1]
    expect(closeOutside).toBeDefined()
    act(() => { closeOutside({ target: itemNodes[0] }) })
    expect(menus()).toHaveLength(1)
    act(() => { closeOutside({ target: new FakeNode() }) })
    expect(menus()).toHaveLength(0)
  })

  it('tracks resize and captured scroll, then removes both listeners on close and unmount', () => {
    const { documentMock, windowMock } = setup()
    openMenu()
    const resize = windowMock.addEventListener.mock.calls.find(([type]) => type === 'resize')
    const scroll = documentMock.addEventListener.mock.calls.find(([type]) => type === 'scroll')
    expect(resize).toBeDefined()
    expect(scroll?.[2]).toBe(true)

    triggerNode.rect = { left: 900, bottom: 80 }
    act(() => { resize?.[1]() })
    expect(menus()[0]!.props.style).toEqual({ top: 85, left: 648 })

    act(() => { trigger().props.onClick() })
    expect(windowMock.removeEventListener).toHaveBeenCalledWith('resize', resize?.[1])
    expect(documentMock.removeEventListener).toHaveBeenCalledWith('scroll', scroll?.[1], true)

    openMenu()
    const unmountResize = windowMock.addEventListener.mock.calls.filter(([type]) => type === 'resize').at(-1)
    const unmountScroll = documentMock.addEventListener.mock.calls.filter(([type]) => type === 'scroll').at(-1)
    act(() => { tree!.unmount() })
    tree = undefined
    expect(windowMock.removeEventListener).toHaveBeenCalledWith('resize', unmountResize?.[1])
    expect(documentMock.removeEventListener).toHaveBeenCalledWith('scroll', unmountScroll?.[1], true)
  })

  it('navigates menu treeitems and restores trigger focus on Escape', async () => {
    setup()
    act(() => {
      trigger().props.onKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() })
    })
    menuNode ??= new FakeNode()
    itemNodes = [new FakeNode(), new FakeNode()]
    menuNode.items = itemNodes
    await act(async () => { await Promise.resolve() })
    expect(activeElement).toBe(itemNodes[0])

    const navigate = (key: string) => root().props.onKeyDown({ key, preventDefault: vi.fn() })
    act(() => { navigate('ArrowDown') })
    expect(activeElement).toBe(itemNodes[1])
    act(() => { navigate('ArrowUp') })
    expect(activeElement).toBe(itemNodes[0])
    act(() => { navigate('End') })
    expect(activeElement).toBe(itemNodes[1])
    act(() => { navigate('Home') })
    expect(activeElement).toBe(itemNodes[0])

    await act(async () => {
      navigate('Escape')
      await Promise.resolve()
    })
    expect(menus()).toHaveLength(0)
    expect(activeElement).toBe(triggerNode)
  })
})
