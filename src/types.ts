export type PullBaseConfig = {
  outfile_basename: string
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

export type CheckoutStep = {
  name: string
  uses: 'actions/checkout@v2'
}

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

export type FlatStep = PullStep | PushStep | CheckoutStep

export type FlatJob = {
  runs_on: string
  steps: FlatStep[]
}

interface FlatJobWithName extends FlatJob {
  name: string
}

interface OnFlatState {
  workflow_dispatch?: any
  push?: {
    branches: string[]
  }
  schedule?: {
    cron: string
  }
}
export type FlatState = {
  name: string
  on: OnFlatState
  jobs: FlatJobWithName[]
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
