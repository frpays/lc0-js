

FILES:=$(shell cat bundled.txt)


all:: $(FILES)

clean::

dist_clean::
	rm -f $(FILES)


weights_9155.txt.gz:
	wget -O $@ https://lczero.org/get_network?sha=22ea83dfb2de66573010ad3415ac4fbedab5cd7c0b5453252a51cedeaa47f7e1

ender62.txt.gz:
	wget -O $@ https://github.com/dkappe/leela-chess-weights/files/2507425/ender62.txt.gz

ender128-90l.pb.gz:
	wget -O $@ https://github.com/dkappe/leela-chess-weights/files/2688444/ender128-90l.pb.gz

weights_11248.dat.gz:
	wget -O $@ https://lczero.org/get_network?sha=994de36c13ddf2540bf588817fcca0cb4e279e61c7d118c3bccc9c74419caecd

weights_32195.dat.gz:
	wget -O $@ https://lczero.org/get_network?sha=59443ceebec71e2e88317e645115bf2f5ee5a704b86ae78ee8365c90a080225c

