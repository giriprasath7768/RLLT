Add-Type -AssemblyName System.Drawing
$img3 = [System.Drawing.Image]::FromFile("i:\RLLT\Webapp\frontend\public\highlight.png")
$bmp3 = new-object System.Drawing.Bitmap($img3)

$minX = $bmp3.Width; $maxX = 0;
$minY = $bmp3.Height; $maxY = 0;

for ($y = 0; $y -lt $bmp3.Height; $y+=10) {
    for ($x = 0; $x -lt $bmp3.Width; $x+=10) {
        $alpha = $bmp3.GetPixel($x, $y).A
        if ($alpha -gt 10) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
Write-Host "Highlight Bounds:" $minX "," $minY "to" $maxX "," $maxY
$w = $maxX - $minX
$h = $maxY - $minY
Write-Host "Width:" $w "Height:" $h
