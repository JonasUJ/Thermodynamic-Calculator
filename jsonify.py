import json
import re

lineRE = re.compile(r'^(?P<name>.+) \((?P<state>[a-zA-Z]{1,2})\s?(?P<other>.+)?\) (?P<H>[-0-9.]+) (?P<S>[-0-9.]+) (?P<G>[-0-9.]+)$')

class ChemObject:

    def __init__(self, match: re.Match):
        self.name = match.group('name')
        self.state = match.group('state')
        self.other = match.group('other')
        self.H = match.group('H')
        self.S = match.group('S')
        self.G = match.group('G')

    def asDict(self):
        return {
            'name': self.name,
            'state': self.state,
            'other': self.other,
            'H': self.H,
            'S': self.S,
            'G': self.G,
        }

def parseLine(line: str):
    match = lineRE.match(line)
    if match == None:
        raise Exception(f'Error on line: {line}')
    return ChemObject(match)

cos = list()

with open('thermaldata.txt', 'r') as fp:
    for line in fp.readlines():
        cos.append(parseLine(line))

jsondict = dict()

for co in cos:
    jsondict[co.name] = co.asDict()

with open('values.json', 'w') as fp:
    json.dump(jsondict, fp)

print('Finished')
