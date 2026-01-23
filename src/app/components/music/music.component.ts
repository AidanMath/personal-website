import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  year: number;
  spotifyUrl?: string;
}

@Component({
  selector: 'app-music',
  imports: [CommonModule],
  templateUrl: './music.component.html',
  styleUrl: './music.component.scss'
})
export class MusicComponent {
  // Sample albums - replace with your favorites!
  albums: Album[] = [
    {
      id: '1',
      title: 'Random Access Memories',
      artist: 'Daft Punk',
      coverUrl: 'https://i.scdn.co/image/ab67616d0000b2739b9b36b0e22870b9f542d937',
      year: 2013,
      spotifyUrl: 'https://open.spotify.com/album/4m2880jivSbbyEGAKfITCa'
    },
    {
      id: '2',
      title: 'OK Computer',
      artist: 'Radiohead',
      coverUrl: 'https://i.scdn.co/image/ab67616d0000b273c8b444df094279e70d0ed856',
      year: 1997,
      spotifyUrl: 'https://open.spotify.com/album/6dVIqQ8qmQ5GBnJ9shOYGE'
    },
    {
      id: '3',
      title: 'Discovery',
      artist: 'Daft Punk',
      coverUrl: 'https://i.scdn.co/image/ab67616d0000b2732e02117d76426a08ac7c174f',
      year: 2001,
      spotifyUrl: 'https://open.spotify.com/album/2noRn2Aes5aoNVsU6iWThc'
    },
    {
      id: '4',
      title: 'In Rainbows',
      artist: 'Radiohead',
      coverUrl: 'https://i.scdn.co/image/ab67616d0000b2739a88ea5cf6fe92302c91bfd4',
      year: 2007,
      spotifyUrl: 'https://open.spotify.com/album/5vkqYmiPBYLaalcmjujWxK'
    },
    {
      id: '5',
      title: 'The Dark Side of the Moon',
      artist: 'Pink Floyd',
      coverUrl: 'https://i.scdn.co/image/ab67616d0000b273ea7caaff71dea1051d49b2fe',
      year: 1973,
      spotifyUrl: 'https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv'
    },
    {
      id: '6',
      title: 'Kid A',
      artist: 'Radiohead',
      coverUrl: 'https://i.scdn.co/image/ab67616d0000b2731c2b6f1c1ba5f5a2de46dc87',
      year: 2000,
      spotifyUrl: 'https://open.spotify.com/album/6GjwtEZcfenmOf6l18N7T7'
    }
  ];

  openSpotify(album: Album): void {
    if (album.spotifyUrl) {
      window.open(album.spotifyUrl, '_blank', 'noopener,noreferrer');
    }
  }
}
