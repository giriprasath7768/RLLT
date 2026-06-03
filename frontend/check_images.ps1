Add-Type -AssemblyName System.Drawing
$img1 = [System.Drawing.Image]::FromFile("i:\RLLT\Webapp\frontend\public\Resetbutton.png")
Write-Host "Reset:" $img1.Width "x" $img1.Height
$img2 = [System.Drawing.Image]::FromFile("i:\RLLT\Webapp\frontend\public\submitbutton.png")
Write-Host "Submit:" $img2.Width "x" $img2.Height
