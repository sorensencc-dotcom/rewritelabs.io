cd C:\Users\soren\rewritelabs.io

# 1. Install dev dependencies
npm install --save-dev eslint prettier husky lint-staged jest @babel/preset-env

# 2. Load package.json
$pkg = Get-Content package.json -Raw | ConvertFrom-Json

# 3. Ensure scripts exists
if (-not $pkg.PSObject.Properties.Name.Contains("scripts")) {
    $pkg | Add-Member -MemberType NoteProperty -Name scripts -Value ([ordered]@{})
}

# 4. Convert scripts to hashtable
if ($pkg.scripts.GetType().Name -notin @("OrderedDictionary","Hashtable")) {
    $new = @{}
    $pkg.scripts.PSObject.Properties | ForEach-Object {
        $new[$_.Name] = $_.Value
    }
    $pkg.scripts = $new
}

# 5. Add validation scripts
$pkg.scripts["lint"]   = "eslint ."
$pkg.scripts["format"] = "prettier --write ."
if (-not $pkg.scripts.ContainsKey("test")) {
    $pkg.scripts["test"] = "jest"
}

# 6. Add lint-staged
$pkg | Add-Member -Force -MemberType NoteProperty -Name "lint-staged" -Value ([ordered]@{
    "*.js" = @("eslint --fix", "prettier --write")
})

# 7. Write package.json
$pkg | ConvertTo-Json -Depth 20 | Set-Content package.json

# 8. ESLint config
@'
{
  "env": { "browser": true, "node": true, "es2021": true },
  "extends": ["eslint:recommended"],
  "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },
  "rules": {
    "no-unused-vars": "warn",
    "no-undef": "error",
    "semi": ["error", "always"]
  }
}
