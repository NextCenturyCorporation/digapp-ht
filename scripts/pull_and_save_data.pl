#!/user/bin/perl

# Author:  Thomas Schellenberg (thomas.schellenberg@nextcentury.com)

use strict;
use warnings;
use IO::File;
use JSON;

# autoflush
$| = 1;

if($#ARGV < 3) {
  print "Usage: <script> <es-source-host> <es-source-index> <es-target-host> <es-target-index> [search-size]";
  exit 1;
}

my $esSource = $ARGV[0];
my $esSourceIndex = $ARGV[1];
my $esTarget = $ARGV[2];
my $esTargetIndex = $ARGV[3];
my $searchSize = if defined($ARGV[4]) ? $ARGV[4] : 25;
my $curlOpts = "--connect-timeout 30 --max-time 45";

my $validate = `which jq`;
if($validate eq "") {
  print "Please install the 'jq' tool.\n";
  exit 1;
}

print "\n===== BEGIN DIG DATA PULL & SAVE =====\n";

my @keywords = ("black", "blonde", "brown", "red", "white", "houston", "los angeles", "new york", "san francisco", "washington");
my $maxKeywordLength = 0;
for(my $i = 0; $i < @keywords; ++$i) {
  $maxKeywordLength = $maxKeywordLength > length($keywords[$i]) ? $maxKeywordLength : length($keywords[$i]);
}

my $emailFilename = "emails.txt";
my $imageFilename = "images.txt";
my $offerFilename = "offers.txt";
my $phoneFilename = "phones.txt";
my $serviceFilename = "services.txt";
my $webpageFilename = "webpages.txt";

my $emailFile = IO::File->new("$emailFilename", "w");
my $imageFile = IO::File->new("$imageFilename", "w");
my $offerFile = IO::File->new("$offerFilename", "w");
my $phoneFile = IO::File->new("$phoneFilename", "w");
my $serviceFile = IO::File->new("$serviceFilename", "w");
my $webpageFile = IO::File->new("$webpageFilename", "w");

my %emailHash;
my %imageHash;
my %offerHash;
my %phoneHash;
my %serviceHash;
my %webpageHash;

sub convertToArray {
  if(!defined($_[0])) {
    return ();
  }
  if(ref($_[0]) eq "ARRAY") {
    return @{$_[0]};
  }
  return ($_[0]);
}

sub evalSearchResults {
  my @hits = @{$_[0]};
  my $recursive = $_[1];
  my $keywordIndex = $_[2];

  for(my $i = 0; $i < @hits; ++$i) {
    if($recursive) {
      my $keyword = sprintf("%-*s", $maxKeywordLength, $keywords[$keywordIndex]);
      my $hit = sprintf("%*s", length($searchSize), ($i + 1));
      my $percent = sprintf("%.2f", (($keywordIndex / @keywords) + (($i / @hits) / @keywords)) * 100);
      print "\rKEYWORD $keyword HIT $hit / $searchSize ($percent %)";
    }

    my $id = $hits[$i]->{_id};
    my $source = $hits[$i]->{_source};
    $webpageHash{$id} = encode_json($source);

    my @emails = queryAndSaveToHash($source->{mentionsEmail}, "email", \%emailHash);
    my @phones = queryAndSaveToHash($source->{mentionsPhone}, "phone", \%phoneHash);
    queryAndSaveToHash($source->{mainEntity}->{uri}, "offer", \%offerHash);
    queryAndSaveToHash($source->{mainEntity}->{itemOffered}->{uri}, "adultservice", \%serviceHash);

    my @images = convertToArray($source->{hasImagePart});
    for(my $j = 0; $j < @images; ++$j) {
      queryAndSaveToHash($images[$j]->{uri}, "image", \%imageHash);
    }

    if($recursive) {
      for(my $j = 0; $j < @emails; ++$j) {
        my $termResults = runTermQuery("mentionsEmail", $emails[$j]);
        evalSearchResults($termResults->{hits}->{hits}, 0);
      }

      for(my $j = 0; $j < @phones; ++$j) {
        my $termResults = runTermQuery("mentionsPhone", $phones[$j]);
        evalSearchResults($termResults->{hits}->{hits}, 0);
      }
    }
  }
}

sub queryAndSaveToHash {
  my @data = convertToArray($_[0]);
  for(my $i = 0; $i < @data; ++$i) {
    if(!exists($_[2]->{$data[$i]})) {
      my $results = runIdQuery($_[1], $data[$i]);
      my @hits = @{$results->{hits}->{hits}};
      if(scalar @hits > 0) {
        $_[2]->{$data[$i]} = encode_json($hits[0]->{_source});
      }
    }
  }
  return @data;
}

sub runIdQuery {
  my $response = `curl $curlOpts -XPOST "$esSource/$esSourceIndex/$_[0]/_search?size=$searchSize" -d' {"query":{"term":{"_id":"$_[1]"}}}' 2>/dev/null`;
  return decode_json($response);
}

sub runSearchQuery {
  my $response = `curl $curlOpts -XPOST "$esSource/$esSourceIndex/webpage/_search?size=$searchSize" -d' {"query":{"query_string":{"query":"$_[0]","fields":["_all"]}}},{"sort":[{"timestamp":{"order":"desc"}}]}' 2>/dev/null`;
  return decode_json($response);
}

sub runTermQuery {
  my $response = `curl $curlOpts -XPOST "$esSource/$esSourceIndex/webpage/_search?size=$searchSize" -d' {"query":{"term":{"$_[0]":"$_[1]"}}},{"sort":[{"timestamp":{"order":"desc"}}]}' 2>/dev/null`;
  return decode_json($response);
}

sub saveToFile {
  my @data = values %{$_[0]};
  my $file = $_[1];
  print "\nSaving ", scalar @data, " $_[2]\n";
  for(my $i = 0; $i < @data; ++$i) {
    print $file "$data[$i]\n";
  }
}

sub uploadToES {
  my $response = `cat $_[0] | jq -c '{"index": {"_index": "$esTargetIndex", "_type": "$_[1]", "_id": .uri}}, .' | curl -XPOST $esTarget/_bulk --data-binary @-`;
  return $response;
}

# MAIN

my $keywordsText = join(", ", @keywords);
print "\nGetting the top $searchSize results from the $esSourceIndex index for the search keywords:\n$keywordsText\n\n";

for(my $i = 0; $i < @keywords; ++$i) {
  my $searchResults = runSearchQuery($keywords[$i]);
  evalSearchResults($searchResults->{hits}->{hits}, 1, $i);
}

print "\n\nFinished search queries.  Saving data to files...\n";

saveToFile(\%emailHash, $emailFile, "emails");
saveToFile(\%imageHash, $imageFile, "images");
saveToFile(\%offerHash, $offerFile, "offers");
saveToFile(\%phoneHash, $phoneFile, "phones");
saveToFile(\%serviceHash, $serviceFile, "services");
saveToFile(\%webpageHash, $webpageFile, "webpages");

undef $emailFile;
undef $imageFile;
undef $offerFile;
undef $phoneFile;
undef $serviceFile;
undef $webpageFile;

print "\n\nFinished saving data to files.  Uploading data to the $esTargetIndex index...\n";

`curl -XPUT "$esTarget/$esTargetIndex" -d '{"mappings":{"adultservice":{"properties":{"a":{"type":"string","index":"not_analyzed"},"age":{"type":"string","index":"not_analyzed"},"ethnicity":{"type":"string","index":"not_analyzed"},"eyeColor":{"type":"string","index":"not_analyzed"},"hairColor":{"type":"string","index":"not_analyzed"},"height":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"offers":{"properties":{"a":{"type":"string","index":"not_analyzed"},"mainEntityOfPage":{"properties":{"a":{"type":"string","index":"not_analyzed"},"mentionsEmail":{"type":"string","index":"not_analyzed"},"mentionsPhone":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"}}},"seller":{"properties":{"a":{"type":"string","index":"not_analyzed"},"email":{"properties":{"a":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"}}},"telephone":{"properties":{"a":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"},"weight":{"type":"string","index":"not_analyzed"}}},"offer":{"properties":{"a":{"type":"string","index":"not_analyzed"},"availableAtOrFrom":{"properties":{"address":{"properties":{"a":{"type":"string","index":"not_analyzed"},"addressCountry":{"type":"string","index":"not_analyzed"},"addressLocality":{"type":"string","index":"not_analyzed"},"addressRegion":{"type":"string","index":"not_analyzed"},"extractorOutput":{"type":"string","index":"not_analyzed"},"geo":{"properties":{"a":{"type":"string","index":"not_analyzed"},"latitude":{"type":"string","index":"not_analyzed"},"longitude":{"type":"string","index":"not_analyzed"}}},"key":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"itemOffered":{"properties":{"a":{"type":"string","index":"not_analyzed"},"age":{"type":"string","index":"not_analyzed"},"ethnicity":{"type":"string","index":"not_analyzed"},"eyeColor":{"type":"string","index":"not_analyzed"},"hairColor":{"type":"string","index":"not_analyzed"},"height":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"},"weight":{"type":"string","index":"not_analyzed"}}},"mainEntityOfPage":{"properties":{"a":{"type":"string","index":"not_analyzed"},"dateCreated":{"type":"date","format":"dateOptionalTime"},"description":{"type":"string"},"hasImagePart":{"properties":{"a":{"type":"string","index":"not_analyzed"},"identifier":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"},"url":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}}}},"mentionsEmail":{"type":"string","index":"not_analyzed"},"mentionsPhone":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"publisher":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"},"url":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}}}},"priceSpecification":{"properties":{"a":{"type":"string","index":"not_analyzed"},"billingIncrement":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"price":{"type":"string","index":"not_analyzed"},"unitCode":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"}}},"seller":{"properties":{"a":{"type":"string","index":"not_analyzed"},"email":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"telephone":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"title":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"},"validFrom":{"type":"date","format":"dateOptionalTime"}}},"webpage":{"properties":{"a":{"type":"string","index":"not_analyzed"},"dateCreated":{"type":"date","format":"dateOptionalTime"},"description":{"type":"string"},"hasImagePart":{"properties":{"a":{"type":"string","index":"not_analyzed"},"identifier":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"},"url":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}}}},"mainEntity":{"properties":{"a":{"type":"string","index":"not_analyzed"},"availableAtOrFrom":{"properties":{"a":{"type":"string","index":"not_analyzed"},"address":{"properties":{"a":{"type":"string","index":"not_analyzed"},"addressCountry":{"type":"string","index":"not_analyzed"},"addressLocality":{"type":"string","index":"not_analyzed"},"addressRegion":{"type":"string","index":"not_analyzed"},"geo":{"properties":{"a":{"type":"string","index":"not_analyzed"},"latitude":{"type":"string","index":"not_analyzed"},"longitude":{"type":"string","index":"not_analyzed"}}},"key":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"itemOffered":{"properties":{"a":{"type":"string","index":"not_analyzed"},"age":{"type":"string","index":"not_analyzed"},"ethnicity":{"type":"string","index":"not_analyzed"},"eyeColor":{"type":"string","index":"not_analyzed"},"hairColor":{"type":"string","index":"not_analyzed"},"height":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"},"weight":{"type":"string","index":"not_analyzed"}}},"priceSpecification":{"properties":{"a":{"type":"string","index":"not_analyzed"},"billingIncrement":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"price":{"type":"string","index":"not_analyzed"},"unitCode":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"}}},"seller":{"properties":{"a":{"type":"string","index":"not_analyzed"},"email":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"telephone":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"},"validFrom":{"type":"date","format":"dateOptionalTime"}}},"mentionsEmail":{"type":"string","index":"not_analyzed"},"mentionsPhone":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"publisher":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"},"url":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}}}},"phone":{"properties":{"a":{"type":"string","index":"not_analyzed"},"email":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"owner":{"properties":{"a":{"type":"string","index":"not_analyzed"},"email":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"telephone":{"properties":{"a":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"image":{"properties":{"a":{"type":"string","index":"not_analyzed"},"identifier":{"type":"string","index":"not_analyzed"},"isImagePartOf":{"properties":{"a":{"type":"string","index":"not_analyzed"},"mainEntity":{"properties":{"a":{"type":"string","index":"not_analyzed"},"itemOffered":{"properties":{"a":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"}}},"seller":{"properties":{"a":{"type":"string","index":"not_analyzed"},"email":{"properties":{"a":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"}}},"telephone":{"properties":{"a":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"mentionsEmail":{"type":"string","index":"not_analyzed"},"mentionsPhone":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"}}},"similarImageId":{"properties":{"a":{"type":"string","index":"not_analyzed"},"similarImageId":{"type":"string","index":"not_analyzed"},"similarityScore":{"type":"string","index":"not_analyzed"},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"},"url":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}}}},"seller":{"properties":{"a":{"type":"string","index":"not_analyzed"},"clusterMethod":{"type":"string","index":"not_analyzed"},"email":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"telephone":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"email":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"owner":{"properties":{"a":{"type":"string","index":"not_analyzed"},"email":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"telephone":{"properties":{"a":{"type":"string","index":"not_analyzed"},"name":{"type":"string","fields":{"raw":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}},"uri":{"type":"string","index":"not_analyzed"}}}}}'`;

uploadToES($emailFilename, "email");
uploadToES($imageFilename, "image");
uploadToES($offerFilename, "offer");
uploadToES($phoneFilename, "phone");
uploadToES($serviceFilename, "service");
uploadToES($webpageFilename, "webpage");

print "\n===== END DIG DATA PULL & SAVE =====\n";
