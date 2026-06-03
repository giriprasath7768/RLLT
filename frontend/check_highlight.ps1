Add-Type -AssemblyName System.Drawing
$img3 = [System.Drawing.Image]::FromFile("i:\RLLT\Webapp\frontend\public\highlight.png")
Write-Host "Highlight:" $img3.Width "x" $img3.Height
