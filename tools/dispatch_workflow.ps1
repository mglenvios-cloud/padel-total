param(
  [string]$WorkflowFile = 'blender-render.yml',
  [string]$Repo = ''
)

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error 'gh CLI not found. Install from https://cli.github.com/'
  exit 1
}

$args = @('workflow','run',$WorkflowFile,'--ref','main')

# default inputs
$args += @('--field','render_mode=high')
$args += @('--field','export_glb=1')

if ($Repo -ne '') { $args += @('--repo',$Repo) }

Write-Host 'Running: gh' $args
gh @args
Write-Host 'Workflow dispatched. Use `gh run list` to follow progress.'
