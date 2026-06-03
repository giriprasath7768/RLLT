Add-Type -AssemblyName System.Drawing
$img1 = [System.Drawing.Image]::FromFile("i:\RLLT\Webapp\frontend\public\Resetbutton.png")
$bmp1 = new-object System.Drawing.Bitmap($img1)

$minX = $bmp1.Width; $maxX = 0;
$minY = $bmp1.Height; $maxY = 0;

for ($y = 0; $y -lt $bmp1.Height; $y+=10) {
    for ($x = 0; $x -lt $bmp1.Width; $x+=10) {
        $alpha = $bmp1.GetPixel($x, $y).A
        if ($alpha -gt 10) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
Write-Host "Reset Bounds:" $minX "," $minY "to" $maxX "," $maxY
$w = $maxX - $minX
$h = $maxY - $minY
Write-Host "Width:" $w "Height:" $h
