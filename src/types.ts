// @ts-ignore
import * as vscode from 'vscode'

export type PullBaseConfig = {
  outfile_basename?: string
  postprocessing: string
}
export type PullHttpConfig = {
  http_url: string
} & PullBaseConfig

export type PullSqlConfig = {
  sql_connstring: string
  sql_queryfile: string
  sql_format: 'csv' | 'json'
} & PullBaseConfig

export type PullConfig = PullHttpConfig | PullSqlConfig

export type PushConfig = {} // TODO: once we have a push action

export type PullStep = {
  name: string
  uses: 'githubocto/flat-pull@v1'
  with: PullConfig
}

export type PushStep = {
  name: string
  uses: 'githubocto/flat-push@v1'
  with: PushConfig
}

export type CheckoutStep = {
  name: string
  uses: 'actions/checkout@v2'
}

export type FlatStep = {
  name: 'Fetch data'
  uses: 'githubocto/flat@main'
  with: PullConfig
}

export type Step = CheckoutStep | FlatStep

export type FlatJob = {
  'runs-on': string
  steps: Step[]
}

interface FlatUIJob extends FlatJob {
  name: string
}

interface OnFlatState {
  workflow_dispatch?: any
  push?: {
    branches: string[]
  }
  schedule: {
    cron: string
  }[]
}
export type FlatState = {
  name: string
  on: OnFlatState
  jobs: FlatUIJob[]
}

export type FlatYamlStep = {
  name: string
  uses: string
  with?: {
    [k: string]: string
  }
}

export type FlatYamlJob = {
  'runs-on': 'ubuntu-latest'
  steps: [
    {
      name: 'Checkout repo'
      uses: 'actions/checkout@v2'
    },
    ...Array<FlatYamlStep>
  ]
}

export type FlatYamlDoc = {
  name: 'Flat'
  on: {
    workflow_dispatch: null
    push?: null
    schedule?: [
      {
        cron: string
      }
    ]
  }
  jobs: {
    [k: string]: FlatYamlJob
  }
}

export interface CommitOptions {
  all?: boolean | 'tracked'
}

export interface Branch {
  readonly name: string
}

export interface RepositoryState {
  HEAD: Branch | undefined | null
  refs: Branch[]
  workingTreeChanges: Change[]
  indexChanges: Change[]
  mergeChanges: Change[]
  onDidChange: vscode.Event<void>
}

export interface Change {
  readonly uri: vscode.Uri
}

export interface Remote {
  fetchUrl: string
  isReadOnly: boolean
  name: string
  pushUrl: string
}

export interface RawRepository {
  remotes: Remote[]
  add(resources: vscode.Uri[]): Promise<void>
  commit(message: string): Promise<void>
  createBranch(name: string, checkout: boolean, ref?: string): Promise<void>
  deleteBranch(name: string, force?: boolean): Promise<void>

  checkout(treeish: string): Promise<void>

  push(
    remoteName?: string,
    branchName?: string,
    setUpstream?: boolean
  ): Promise<void>
}

export interface Repository {
  state: RepositoryState

  createBranch(name: string, checkout: boolean, ref?: string): Promise<void>
  deleteBranch(name: string, force?: boolean): Promise<void>

  checkout(treeish: string): Promise<void>

  push(
    remoteName?: string,
    branchName?: string,
    setUpstream?: boolean
  ): Promise<void>

  commit(message: string, opts?: CommitOptions): Promise<void>

  _repository: RawRepository
}

export interface GitAPI {
  repositories: Repository[]
  getRepository(uri: vscode.Uri): Repository | null
  onDidOpenRepository: vscode.Event<Repository>
  onDidCloseRepository: vscode.Event<Repository>
}
