# ============================================
#  CLEAN REGENERATION OF /tools DIRECTORY
#  ASCII-only, BOM-free (your PowerShell UTF8)
# ============================================

Write-Host "`n=== Resetting /tools directory ===`n"

# Remove old directory
if (Test-Path "tools") {
    Remove-Item -Recurse -Force "tools"
}
New-Item -ItemType Directory -Path "tools" | Out-Null

function Write-ToolFile($name, $content) {
    $path = Join-Path "tools" $name
    Set-Content -Path $path -Value $content -Encoding UTF8
    Write-Host "Wrote: $name"
}

Write-ToolFile "docs.list.json" @'
{
  "name": "docs.list",
  "description": "List documentation files.",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "recursive": { "type": "boolean", "default": true }
    },
    "required": ["path"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "files": { "type": "array", "items": { "type": "string" } }
    }
  }
}
'@

Write-ToolFile "docs.open.json" @'
{
  "name": "docs.open",
  "description": "Open a documentation file.",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" }
    },
    "required": ["path"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "content": { "type": "string" }
    }
  }
}
'@

Write-ToolFile "docs.save.json" @'
{
  "name": "docs.save",
  "description": "Save updated content to a file.",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "content": { "type": "string" }
    },
    "required": ["path", "content"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "status": { "type": "string" }
    }
  }
}
'@

Write-ToolFile "docs.validate.json" @'
{
  "name": "docs.validate",
  "description": "Validate a documentation file.",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" }
    },
    "required": ["path"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "valid": { "type": "boolean" },
      "errors": { "type": "array", "items": { "type": "string" } },
      "warnings": { "type": "array", "items": { "type": "string" } }
    }
  }
}
'@

Write-ToolFile "docs.visualize_links.json" @'
{
  "name": "docs.visualize_links",
  "description": "Generate a link graph for documentation.",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" }
    },
    "required": ["path"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "graph": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "source": { "type": "string" },
            "target": { "type": "string" }
          }
        }
      }
    }
  }
}
'@

Write-ToolFile "sweeper.enumerate.json" @'
{
  "name": "sweeper.enumerate",
  "description": "Enumerate files for sweeper processing.",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "recursive": { "type": "boolean", "default": true }
    },
    "required": ["path"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "targets": { "type": "array", "items": { "type": "string" } }
    }
  }
}
'@

Write-ToolFile "sweeper.classify.json" @'
{
  "name": "sweeper.classify",
  "description": "Classify files for sweeper actions.",
  "input_schema": {
    "type": "object",
    "properties": {
      "paths": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["paths"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "classes": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "path": { "type": "string" },
            "type": { "type": "string" },
            "recommended_action": { "type": "string" }
          }
        }
      }
    }
  }
}
'@

Write-ToolFile "sweeper.run_pipeline.json" @'
{
  "name": "sweeper.run_pipeline",
  "description": "Run a sweeper pipeline on target files.",
  "input_schema": {
    "type": "object",
    "properties": {
      "pipeline": { "type": "array", "items": { "type": "string" } },
      "targets": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["pipeline", "targets"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "results": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "path": { "type": "string" },
            "status": { "type": "string" },
            "changes": { "type": "array", "items": { "type": "string" } }
          }
        }
      }
    }
  }
}
'@

Write-ToolFile "sweeper.report.json" @'
{
  "name": "sweeper.report",
  "description": "Report results of the last sweeper run.",
  "input_schema": {
    "type": "object",
    "properties": {}
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "summary": { "type": "string" },
      "stats": {
        "type": "object",
        "properties": {
          "processed": { "type": "number" },
          "changed": { "type": "number" },
          "errors": { "type": "number" }
        }
      }
    }
  }
}
'@

Write-ToolFile "classify.files.json" @'
{
  "name": "classify.files",
  "description": "Classify files by type.",
  "input_schema": {
    "type": "object",
    "properties": {
      "paths": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["paths"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "classes": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "path": { "type": "string" },
            "type": { "type": "string" }
          }
        }
      }
    }
  }
}
'@

Write-ToolFile "classify.request.json" @'
{
  "name": "classify.request",
  "description": "Interpret user intent from a request string.",
  "input_schema": {
    "type": "object",
    "properties": {
      "request": { "type": "string" }
    },
    "required": ["request"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "recommended_tool": { "type": "string" }
    }
  }
}
'@

Write-ToolFile "classify.priority.json" @'
{
  "name": "classify.priority",
  "description": "Prioritize a list of items.",
  "input_schema": {
    "type": "object",
    "properties": {
      "items": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["items"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "prioritized": { "type": "array", "items": { "type": "string" } }
    }
  }
}
'@

Write-ToolFile "system.healthcheck.json" @'
{
  "name": "system.healthcheck",
  "description": "Check system health.",
  "input_schema": {
    "type": "object",
    "properties": {}
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "status": { "type": "string" },
      "components": {
        "type": "object",
        "additionalProperties": { "type": "string" }
      }
    }
  }
}
'@

Write-ToolFile "system.exec.json" @'
{
  "name": "system.exec",
  "description": "Execute a whitelisted system command.",
  "input_schema": {
    "type": "object",
    "properties": {
      "command": { "type": "string" }
    },
    "required": ["command"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "exit_code": { "type": "number" },
      "stdout": { "type": "string" },
      "stderr": { "type": "string" }
    }
  }
}
'@

Write-ToolFile "system.logs.json" @'
{
  "name": "system.logs",
  "description": "Retrieve system logs.",
  "input_schema": {
    "type": "object",
    "properties": {
      "limit": { "type": "number", "default": 200 }
    }
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "entries": { "type": "array", "items": { "type": "string" } }
    }
  }
}
'@

Write-ToolFile "system.inspect.json" @'
{
  "name": "system.inspect",
  "description": "Inspect running tasks.",
  "input_schema": {
    "type": "object",
    "properties": {}
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "tasks": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "status": { "type": "string" },
            "details": { "type": "string" }
          }
        }
      }
    }
  }
}
'@

Write-Host "`n=== Tools regenerated successfully ===`n"
