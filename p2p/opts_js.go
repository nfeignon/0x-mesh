// +build js,wasm

package p2p

import (
	"context"

	libp2p "github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p-core/host"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	dhtopts "github.com/libp2p/go-libp2p-kad-dht/opts"
	pubsub "github.com/libp2p/go-libp2p-pubsub"
	ws "github.com/libp2p/go-ws-transport"
)

const (
	// maxReceiveBatch is the maximum number of new messages to receive at once.
	maxReceiveBatch = 100
	// maxShareBatch is the maximum number of messages to share at once.
	maxShareBatch = 50
	// peerCountLow is the target number of peers to connect to at any given time.
	peerCountLow = 10
	// peerCountHigh is the maximum number of peers to be connected to. If the
	// number of connections exceeds this number, we will prune connections until
	// we reach peerCountLow.
	peerCountHigh = 12
)

func getHostOptions(ctx context.Context, config Config) ([]libp2p.Option, error) {
	return []libp2p.Option{
		libp2p.Transport(ws.New),
		// Don't listen on any addresses by default. We can't accept incoming
		// connections in the browser.
		libp2p.ListenAddrs(),
	}, nil
}

func getPubSubOptions() []pubsub.Option {
	return []pubsub.Option{
		pubsub.WithValidateThrottle(64),
		pubsub.WithValidateWorkers(1),
	}
}

// NewDHT returns a new Kademlia DHT instance configured to work with 0x Mesh
// in browser environments.
func NewDHT(ctx context.Context, storageDir string, host host.Host) (*dht.IpfsDHT, error) {
	return dht.New(ctx, host, dhtopts.Client(true), dhtopts.Protocols(dhtProtocolID))
}
