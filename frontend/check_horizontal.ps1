Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("i:\RLLT\Webapp\frontend\public\bookbg.png")
$bmp = new-object System.Drawing.Bitmap($img)
$left = -1
$right = -1
for ($x = 0; $x -lt $bmp.Width; $x++) {
    $alpha = $bmp.GetPixel($x, $bmp.Height / 2).A
    if ($alpha -gt 10 -and $left -eq -1) { $left = $x }
    if ($alpha -gt 10) { $right = $x }
}
Write-Host "Left: $left Right: $right"
