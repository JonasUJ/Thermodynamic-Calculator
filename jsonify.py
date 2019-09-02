import json
import re
import csv

lineRE = re.compile(r'^(?P<name>.+) \((?P<state>[a-zA-Z]{1,2})\s?(?P<other>.+)?\) (?P<H>[-0-9.]+) (?P<S>[-0-9.]+) (?P<G>[-0-9.]+)$')
lineRE2 = re.compile(r'^(?P<name>.+) \((?P<state>[a-zA-Zℓ]{1,2})(?:\)|\s?\)?(?: - )?(?P<other>.+?)\)?) (?P<H>[-0-9.]+) (?P<S>[-0-9.]+) (?P<G>[-0-9.]+)$')

class ChemObject:

    def __init__(self, name, state, other, H, S, G):
        self.name = name
        self.state = state
        self.other = other
        self.H = H
        self.S = S
        self.G = G

    @staticmethod
    def fromMatch(match: re.Match):
        return ChemObject(match.group('name'), match.group('state'), match.group('other'), match.group('H'), match.group('S'), match.group('G'))

    @staticmethod
    def fromRow(row: list):
        return (
            ChemObject(row[0], 's', row[1], row[2], row[5], row[8]),
            ChemObject(row[0], 'l', row[1], row[3], row[6], row[9]),
            ChemObject(row[0], 'g', row[1], row[4], row[7], row[10])
        )

    def asDict(self):
        return {
            'name': self.name,
            'state': self.state,
            'other': self.other,
            'H': self.H,
            'S': self.S,
            'G': self.G,
        }

    def isEmpty(self):
        return self.H == '' and self.S == '' and self.G == ''

    def __eq__(self, other):
        if type(other) != type(self):
            raise NotImplementedError()
        return self.name == other.name and self.state == other.state

    def __repr__(self):
        return f'ChemObject({self.name}, {self.state}'#', {self.other}, H={self.H}, S={self.S}, G={self.G})'

    def __hash__(self):
        return hash(self.__repr__())


def parseWithRE(regex: re.Pattern, file):
    print('Parsing', file)

    cos = list()
    matches = 0

    with open(file, 'r', encoding='utf-8') as fp:
        for line in fp.readlines():
            match = regex.match(line)
            if match == None:
                raise Exception(f'Error on line {line}')
            matches += 1
            cos.append(ChemObject.fromMatch(match))

    return set(cos)


def parseWithCSV(file):
    print('Parsing', file)

    l = list()

    with open(file, 'r', encoding='utf-8') as fp:
        for row in csv.reader(fp,
                quotechar='"',
                delimiter=',',
                quoting=csv.QUOTE_ALL,
                skipinitialspace=True):
            l.extend(ChemObject.fromRow(row))
    i = filter(lambda o: not o.isEmpty(), l)

    return set(i)


s = parseWithCSV('thermaldata3.csv')
l = len(s)
print('Found', l)
tmp = parseWithRE(lineRE2, 'thermaldata2.txt')
s = s.union(tmp)
print('Found', len(tmp))
print('Discarding', len(tmp) + l - len(s))
print('New total', len(s))
l = len(s)
tmp = parseWithRE(lineRE, 'thermaldata.txt')
s = s.union(tmp)
print('Found', len(tmp))
print('Discarding', len(tmp) + l - len(s))
print('New total', len(s))

jsonlist = list()
for o in s:
    jsonlist.append(o.asDict())

with open('values.json', 'w') as fp:
    json.dump(jsonlist, fp)

print('Found a total of', len(jsonlist))
