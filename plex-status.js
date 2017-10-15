/*
Setup with crontab:
* * * * * /usr/bin/node /home/dirrk/scripts/plex-info/index.js >> /var/log/plex/plexstatus.log 2>/dev/null
Setup splunk to consume json with timestamp from utc on timestamp field
Example dashboard: http://imgur.com/E5jBA7S
*/

var wreck = require('wreck'),
    _ = require('lodash'),
    Parser = require('xml2js').Parser;

var token = process.env.TOKEN;
var url = process.env.PLEX_SERVER + '/status/sessions?X-Plex-Token=' + token;

wreck.get(url, function (err, response, payload) {

    var parser = new Parser({ mergeAttrs: true, explicitArray: false });

    if (err || response.statusCode !== 200) {
        var timestamp = new Date().toISOString();
        console.log(JSON.stringify({ success: false, timestamp: timestamp, statusCode: response.statusCode }));
        process.exit();
    }

    parser.parseString(payload.toString('utf8'), function(err, result) {

        if (!err) {
            return processOutput(result);
        }
        process.exit();
    });
});

function processOutput(payload) {

    console.log(JSON.stringify(payload));
    var timestamp = new Date().toISOString();
    var videos = getArray(payload, 'MediaContainer.Video');

    _.forEach(videos, function (video) {
        var output = {};

        output.success = true;
        output.timestamp = timestamp;
        output.title = video.title;
        output.plexId = video.ratingKey;
        output.plexType = video.type;
        output.year = video.year;

        if (video.type === 'episode') {
          output.show = video.grandparentTitle;
          output.season = video.parentIndex;
          output.episode = video.index;
        }

        var user = _.get(video, 'User');

        if (user) {
          output.user = user.title;
          output.userId = user.id;
        }

        var player = _.get(video, 'Player');

        if (player) {
          output.platform = player.platform;
          output.device = player.device;
          output.player = player.title;
          output.status = player.state;
          output.player_address = player.address;
        }

        var transcode = _.get(video, 'TranscodeSession');

        if (transcode) {
          output.video_transcoding = transcode.videoDecision;
          output.audio_transcoding = transcode.audioDecision;

          output.throttled = transcode.throttled;
          output.progress = Math.floor(transcode.progress);
        }

        var media = _.get(video, 'Media');

        if (media) {
          output.container = media.container;
          output.resolution = media.videoResolution;
          output.videoCodec = media.videoCodec;
          output.audioCodec = media.audioCodec;
          output.video_height = media.height;
          output.video_width = media.width;
          output.framerate = media.videoFrameRate;
          output.bitrate = media.bitrate;
          output.optimized_for_streaming = media.optimizedForStreaming;

          var part = getFirst(media, 'Part');
          output.file = part.file;
          output.file_size = part.size;
        }

        output.sessionId = _.get(video, 'Session.id');
        output.bandwidth = _.get(video, 'Session.bandwidth');
        output.sessionlocation = _.get(video, 'Session.location');

        output.directors = getTags(_.get(video, 'Director'));
        output.writers = getTags(_.get(video, 'Writer'));
        output.producers = getTags(_.get(video, 'Producer'));
        output.genre = getTags(_.get(video, 'Genre'));
        output.actors = getTags(_.get(video, 'Role'));

        console.log(JSON.stringify(output));
    });
    process.exit();
}


function getTags(obj) {
    if (_.isArray(obj)) {
        return obj.map(function(o) {
            return o.tag || '';
        });
    } else if (_.isObject(obj)) {
        return [obj.tag];
    }
    return undefined;
}

function getArray(obj, str) {
    var target = _.get(obj, str);

    if (!target) {
        return [];
    }

    if (!_.isArray(target)) {
        return [ target ];
    }

    return target;
}

function getFirst(obj, str) {
    return _.first(getArray(obj, str));
}
