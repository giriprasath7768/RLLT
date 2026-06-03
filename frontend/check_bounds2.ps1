Add-Type -AssemblyName System.Drawing
$img2 = [System.Drawing.Image]::FromFile("i:\RLLT\Webapp\frontend\public\submitbutton.png")
$bmp2 = new-object System.Drawing.Bitmap($img2)

$minX = $bmp2.Width; $maxX = 0;
$minY = $bmp2.Height; $maxY = 0;

for ($y = 0; $y -lt $bmp2.Height; $y+=10) {
    for ($x = 0; $x -lt $bmp2.Width; $x+=10) {
        $alpha = $bmp2.GetPixel($x, $y).A
        if ($alpha -gt 10) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
Write-Host "Submit Bounds:" $minX "," $minY "to" $maxX "," $maxY
$w = $maxX - $minX
$h = $maxY - $minY
Write-Host "Width:" $w "Height:" $h
